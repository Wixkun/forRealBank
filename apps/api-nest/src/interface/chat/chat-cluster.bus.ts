import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { Client } from 'pg';
import { randomUUID } from 'crypto';
import { resolveDatabaseOptions } from '../database.options';

// Bus d'événements inter-instances basé sur Postgres LISTEN/NOTIFY.
//
// En production l'API tourne en plusieurs replicas (Swarm) : un événement
// Socket.IO émis par une instance n'atteint que ses propres sockets. Ce bus
// relaie les événements de chat à toutes les instances via la base déjà
// partagée — aucun service supplémentaire (Redis…) n'est nécessaire.
//
// Limite : un payload NOTIFY est plafonné à ~8 Ko par Postgres. Les messages
// trop volumineux sont publiés par référence (voir ChatGateway).

const CHANNEL = 'chat_events';
const RECONNECT_DELAY_MS = 5_000;

// Payload maximal publié en direct ; au-delà, publier une référence.
export const MAX_NOTIFY_BYTES = 7_000;

export type ChatBusMessage =
  | {
      type: 'new_message';
      conversationId: string;
      message: {
        messageId: string;
        conversationId: string;
        senderId: string;
        content: string;
        createdAt: string;
      };
    }
  | { type: 'new_message_ref'; conversationId: string; messageId: string }
  | { type: 'user_typing'; conversationId: string; userId: string }
  | { type: 'user_stopped_typing'; conversationId: string; userId: string }
  | { type: 'user_joined'; conversationId: string; userId: string }
  | { type: 'presence_state'; conversationId: string; userIds: string[] }
  // Présence GLOBALE (en ligne / hors ligne) : chaque instance publie la liste
  // de ses utilisateurs actuellement connectés (au moins un socket actif).
  | { type: 'global_presence'; userIds: string[] }
  // Bannissement : chaque instance ferme immédiatement les sockets de cet
  // utilisateur (invalidation temps réel sur tout le cluster).
  | { type: 'force_disconnect'; userId: string };

export type ChatBusEnvelope = ChatBusMessage & { senderInstanceId: string };

@Injectable()
export class ChatClusterBus implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(ChatClusterBus.name);
  readonly instanceId = randomUUID();

  private listenClient: Client | null = null;
  private reconnectTimer: NodeJS.Timeout | null = null;
  private destroyed = false;
  private readonly handlers = new Set<(message: ChatBusEnvelope) => void>();

  constructor(@InjectDataSource() private readonly dataSource: DataSource) {}

  async onModuleInit() {
    await this.connectListener();
  }

  async onModuleDestroy() {
    this.destroyed = true;
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    if (this.listenClient) {
      this.listenClient.removeAllListeners();
      await this.listenClient.end().catch(() => undefined);
      this.listenClient = null;
    }
  }

  onMessage(handler: (message: ChatBusEnvelope) => void) {
    this.handlers.add(handler);
  }

  // NOTIFY passe par le pool TypeORM existant : pas de connexion dédiée.
  publish(message: ChatBusMessage) {
    const envelope: ChatBusEnvelope = { ...message, senderInstanceId: this.instanceId };
    this.dataSource
      .query('SELECT pg_notify($1, $2)', [CHANNEL, JSON.stringify(envelope)])
      .catch((err: unknown) => {
        this.logger.error(`publish failed: ${err instanceof Error ? err.message : String(err)}`);
      });
  }

  // LISTEN exige une connexion dédiée qui reste ouverte.
  private async connectListener() {
    if (this.destroyed) return;
    const { host, port, username, password, database } = resolveDatabaseOptions();
    const client = new Client({ host, port, user: username, password, database });

    client.on('notification', (notification) => {
      if (notification.channel !== CHANNEL || !notification.payload) return;
      let envelope: ChatBusEnvelope;
      try {
        envelope = JSON.parse(notification.payload) as ChatBusEnvelope;
      } catch {
        return;
      }
      // Chaque instance reçoit aussi ses propres NOTIFY : on les ignore,
      // l'émission locale a déjà eu lieu.
      if (envelope.senderInstanceId === this.instanceId) return;
      this.handlers.forEach((handler) => handler(envelope));
    });

    client.on('error', (err) => {
      this.logger.error(`listener error: ${err.message}`);
      this.scheduleReconnect(client);
    });
    client.on('end', () => this.scheduleReconnect(client));

    try {
      await client.connect();
      await client.query(`LISTEN ${CHANNEL}`);
      this.listenClient = client;
      this.logger.log(`listening on "${CHANNEL}" (instance ${this.instanceId})`);
    } catch (err) {
      this.logger.error(
        `listener connect failed: ${err instanceof Error ? err.message : String(err)}`,
      );
      this.scheduleReconnect(client);
    }
  }

  private scheduleReconnect(staleClient: Client) {
    if (this.destroyed || this.reconnectTimer) return;
    staleClient.removeAllListeners();
    void staleClient.end().catch(() => undefined);
    if (this.listenClient === staleClient) this.listenClient = null;
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      void this.connectListener();
    }, RECONNECT_DELAY_MS);
  }
}
