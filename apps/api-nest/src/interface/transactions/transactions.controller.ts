import {
  Controller,
  Get,
  Param,
  Query,
  UseGuards,
  Req,
  Post,
  Body,
  Inject,
  Headers,
  NotFoundException,
} from '@nestjs/common';
import { Request } from 'express';
import { randomUUID } from 'crypto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { NotBannedGuard } from '../auth/not-banned.guard';
import { BankTransactionEntity } from '@forreal/infrastructure-typeorm';
import { AccountEntity } from '@forreal/infrastructure-typeorm';
import { InvestmentAccountEntity } from '@forreal/infrastructure-typeorm';
import { NotificationEntity } from '@forreal/infrastructure-typeorm';
import { UserEntity } from '@forreal/infrastructure-typeorm';
import { NotificationRepository } from '@forreal/infrastructure-typeorm';
import { InvestmentTransactionEntity } from '@forreal/infrastructure-typeorm';
import { InitiateTransferUseCase } from '@forreal/application';
import { TransferDto } from './dto/transfer.dto';
import { NewsService } from '../feed/news.service';
import { NewsStatus, NotificationType, NotificationTargetType } from '@forreal/domain';

// NotBannedGuard : un compte banni a ses opérations bancaires bloquées même
// si son JWT n'a pas encore expiré (revérification en base à chaque requête).
@Controller('transactions')
@UseGuards(JwtAuthGuard, NotBannedGuard)
export class TransactionsController {
  constructor(
    @InjectRepository(BankTransactionEntity)
    private readonly transactionRepo: Repository<BankTransactionEntity>,
    @InjectRepository(AccountEntity)
    private readonly accountRepo: Repository<AccountEntity>,
    @InjectRepository(InvestmentAccountEntity)
    private readonly investmentRepo: Repository<InvestmentAccountEntity>,
    @InjectRepository(NotificationEntity)
    private readonly notificationRepo: Repository<NotificationEntity>,
    @InjectRepository(UserEntity)
    private readonly userRepo: Repository<UserEntity>,
    @InjectRepository(InvestmentTransactionEntity)
    private readonly investmentTxnRepo: Repository<InvestmentTransactionEntity>,
    @Inject(NewsService)
    private readonly newsService: NewsService,
    @Inject(InitiateTransferUseCase)
    private readonly initiateTransferUseCase: InitiateTransferUseCase,
  ) {}

  @Get('account/:accountId')
  async getTransactionsByAccount(
    @Param('accountId') accountId: string,
    @Req() req: Request,
    @Query('limit') limit: string = '50',
    @Query('type') type?: string,
  ) {
    const userId = (req.user as any).id;

    const account = await this.accountRepo.findOne({
      where: { id: accountId, userId },
    });
    if (!account) {
      throw new NotFoundException('Account not found');
    }

    const queryBuilder = this.transactionRepo
      .createQueryBuilder('transaction')
      .where('transaction.account_id = :accountId', { accountId })
      .orderBy('transaction.created_at', 'DESC')
      .limit(parseInt(limit));

    if (type && type !== 'all') {
      queryBuilder.andWhere('transaction.type = :type', { type });
    }

    const transactions = await queryBuilder.getMany();

    return transactions.map((t) => ({
      id: t.id,
      type: t.type,
      description: t.description,
      date: t.createdAt.toISOString().split('T')[0],
      amount:
        t.type === 'credit' || t.type === 'transfer'
          ? Math.abs(parseFloat(t.amount.toString()))
          : -Math.abs(parseFloat(t.amount.toString())),
      balance: parseFloat(t.balanceAfter.toString()),
    }));
  }

  @Get('recent')
  async getRecentTransactions(@Query('limit') limit: string = '10', @Req() req: Request) {
    const userId = (req.user as any).id;

    const accounts = await this.accountRepo.find({
      where: { userId },
      select: ['id'],
    });
    const accountIds = accounts.map((a) => a.id);

    if (accountIds.length === 0) {
      return [];
    }

    const transactions = await this.transactionRepo
      .createQueryBuilder('transaction')
      .where('transaction.account_id IN (:...accountIds)', { accountIds })
      .orderBy('transaction.created_at', 'DESC')
      .limit(parseInt(limit))
      .getMany();

    return transactions.map((t) => ({
      id: t.id,
      type: t.type,
      description: t.description,
      date: t.createdAt.toISOString().split('T')[0],
      amount: parseFloat(t.amount.toString()),
    }));
  }

  @Post('transfer')
  async initiateTransfer(
    @Req() req: Request,
    @Body() dto: TransferDto,
    @Headers('idempotency-key') idempotencyKey?: string,
  ) {
    const userId = (req.user as any)?.id;

    const result = await this.initiateTransferUseCase.execute({
      userId,
      sourceType: dto.sourceType,
      sourceAccountId: dto.sourceAccountId,
      destinationAccountId: dto.destinationAccountId,
      destinationIban: dto.destinationIban,
      amount: Number(dto.amount),
      description: dto.description,
      idempotencyKey: idempotencyKey?.trim() || null,
    });

    if (!result.success) {
      return { success: false, error: result.message };
    }

    try {
      const amount = Number(dto.amount);
      const formattedAmount = amount.toLocaleString('fr-FR', {
        style: 'currency',
        currency: 'EUR',
      });

      const sourceAccount =
        dto.sourceType === 'bank'
          ? await this.accountRepo.findOne({ where: { id: dto.sourceAccountId, userId } })
          : null;
      // Comparaison d'IBAN insensible aux espaces : les comptes stockent
      // l'IBAN avec espaces, mais il peut arriver normalisé (bénéficiaire
      // enregistré) ou saisi sans espaces.
      const destinationAccount = dto.destinationAccountId
        ? await this.accountRepo.findOne({
            where: { id: dto.destinationAccountId },
            relations: ['user'],
          })
        : dto.destinationIban
          ? await this.accountRepo
              .createQueryBuilder('account')
              .leftJoinAndSelect('account.user', 'user')
              .where(`REPLACE(account.iban, ' ', '') = :iban`, {
                iban: dto.destinationIban.replace(/\s/g, ''),
              })
              .getOne()
          : null;

      const beneficiaryName = destinationAccount?.user
        ? `${destinationAccount.user.firstName} ${destinationAccount.user.lastName}`
        : null;
      const now = new Date();
      const pad = (n: number) => String(n).padStart(2, '0');
      const transactionId = `TRX-${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}-${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}-${randomUUID().slice(0, 8).toUpperCase()}`;

      const transferMetadata = {
        kind: 'TRANSFER',
        status: 'COMPLETED',
        amount,
        currency: 'EUR',
        fees: 0,
        transactionId,
        executedAt: now.toISOString(),
        sourceAccountName:
          sourceAccount?.name ?? (dto.sourceType === 'investment' ? 'Compte Investissement' : null),
        sourceIban: sourceAccount?.iban ?? null,
        destinationAccountName: destinationAccount?.name ?? null,
        destinationIban: destinationAccount?.iban ?? dto.destinationIban ?? null,
        beneficiaryName,
        description: dto.description ?? null,
      };

      const senderNews = await this.newsService.createAutomaticNews({
        targetUserId: userId,
        title: 'Virement effectué',
        subtitle: beneficiaryName
          ? `${formattedAmount} vers ${beneficiaryName}`
          : `Virement de ${formattedAmount}`,
        content: dto.description
          ? `${dto.description} — ${formattedAmount}`
          : `Virement de ${formattedAmount} effectué avec succès.`,
        status: NewsStatus.TRANSACTION,
        metadata: { ...transferMetadata, direction: 'OUT' },
      });

      // Notification « Virement reçu » pour le titulaire du compte crédité : elle
      // cible la news de détail (popup) et non plus une page (/accounts).
      if (destinationAccount?.userId) {
        const recipientNews =
          destinationAccount.userId === userId
            ? senderNews
            : await this.newsService.createAutomaticNews({
                targetUserId: destinationAccount.userId,
                title: 'Virement reçu',
                subtitle: `${formattedAmount} reçu sur ${destinationAccount.name}`,
                content: dto.description
                  ? `${dto.description} — ${formattedAmount}`
                  : `Vous avez reçu un virement de ${formattedAmount}.`,
                status: NewsStatus.TRANSACTION,
                metadata: { ...transferMetadata, direction: 'IN' },
              });

        const notifications = new NotificationRepository(this.notificationRepo, this.userRepo);
        await notifications.create({
          userId: destinationAccount.userId,
          title: 'Virement reçu',
          content:
            `Vous avez reçu un virement de ${formattedAmount}. ${dto.description || ''}`.trim(),
          type: NotificationType.TRANSACTION,
          targetType: NotificationTargetType.NEWS,
          targetId: recipientNews.id,
          targetUrl: `/dashboard?newsId=${recipientNews.id}`,
          // Même virement, plusieurs portes d'entrée : le détail est consultable
          // via la news (targetId) ou via une ligne de relevé (groupKey, jetons
          // séparés par des espaces — crédit ET débit, car un virement interne
          // est visible des deux côtés). Consulter l'une d'elles marque la
          // notification lue.
          groupKey:
            [result.destinationTransactionId, result.sourceTransactionId]
              .filter(Boolean)
              .map((id) => `transaction:${id}`)
              .join(' ') || null,
        });
      }
    } catch {
      // Ne pas bloquer la réponse si la news ou la notification échoue
    }

    return {
      success: true,
      message: result.message,
      sourceBalance: result.sourceBalance,
      destinationBalance: result.destinationBalance,
    };
  }
}
