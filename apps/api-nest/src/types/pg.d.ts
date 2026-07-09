// Déclaration minimale du client `pg` (le paquet ne fournit pas de types et
// @types/pg n'est pas installé). Seule la surface utilisée par le bus
// LISTEN/NOTIFY de la messagerie est déclarée.
declare module 'pg' {
  export interface Notification {
    channel: string;
    payload?: string;
  }

  export interface ClientConfig {
    host?: string;
    port?: number;
    user?: string;
    password?: string;
    database?: string;
  }

  export class Client {
    constructor(config?: ClientConfig);
    connect(): Promise<void>;
    end(): Promise<void>;
    query(text: string, values?: unknown[]): Promise<unknown>;
    on(event: 'notification', listener: (message: Notification) => void): this;
    on(event: 'error', listener: (err: Error) => void): this;
    on(event: 'end', listener: () => void): this;
    removeAllListeners(event?: string): this;
  }
}
