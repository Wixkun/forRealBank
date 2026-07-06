import { Controller, Get, Param, Query, UseGuards, Req, Post, Body, Inject } from '@nestjs/common';
import { Request } from 'express';
import { randomUUID } from 'crypto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { BankTransactionEntity } from '@forreal/infrastructure-typeorm';
import { AccountEntity } from '@forreal/infrastructure-typeorm';
import { InvestmentAccountEntity } from '@forreal/infrastructure-typeorm';
import { NotificationEntity } from '@forreal/infrastructure-typeorm';
import { UserEntity } from '@forreal/infrastructure-typeorm';
import { AccountRepository } from '@forreal/infrastructure-typeorm';
import { InvestmentAccountRepository } from '@forreal/infrastructure-typeorm';
import { BankTransactionRepository } from '@forreal/infrastructure-typeorm';
import { NotificationRepository } from '@forreal/infrastructure-typeorm';
import { InvestmentTransactionEntity } from '@forreal/infrastructure-typeorm';
import { InitiateTransferUseCase } from '@forreal/application';
import { NewsService } from '../feed/news.service';
import { NewsStatus } from '@forreal/domain';

@Controller('transactions')
@UseGuards(JwtAuthGuard)
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
      throw new Error('Account not found');
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
    @Body()
    body: {
      sourceType: 'bank' | 'investment';
      sourceAccountId: string;
      destinationAccountId?: string;
      destinationIban?: string;
      amount: number;
      description?: string;
    },
  ) {
    const userId = (req.user as any)?.id;
    const usecase = new InitiateTransferUseCase(
      new AccountRepository(this.accountRepo),
      new InvestmentAccountRepository(this.investmentRepo, this.investmentTxnRepo),
      new BankTransactionRepository(this.transactionRepo),
      new NotificationRepository(this.notificationRepo, this.userRepo),
    );

    const result = await usecase.execute({
      userId,
      sourceType: body.sourceType,
      sourceAccountId: body.sourceAccountId,
      destinationAccountId: body.destinationAccountId,
      destinationIban: body.destinationIban,
      amount: Number(body.amount),
      description: body.description,
    });

    if (!result.success) {
      return { success: false, error: result.message };
    }

    try {
      const amount = Number(body.amount);
      const formattedAmount = amount.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' });

      const sourceAccount =
        body.sourceType === 'bank'
          ? await this.accountRepo.findOne({ where: { id: body.sourceAccountId, userId } })
          : null;
      const destinationAccount = body.destinationAccountId
        ? await this.accountRepo.findOne({
            where: { id: body.destinationAccountId },
            relations: ['user'],
          })
        : null;

      const beneficiaryName = destinationAccount?.user
        ? `${destinationAccount.user.firstName} ${destinationAccount.user.lastName}`
        : null;
      const now = new Date();
      const pad = (n: number) => String(n).padStart(2, '0');
      const transactionId = `TRX-${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}-${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}-${randomUUID().slice(0, 8).toUpperCase()}`;

      await this.newsService.createAutomaticNews({
        targetUserId: userId,
        title: 'Virement effectué',
        subtitle: beneficiaryName
          ? `${formattedAmount} vers ${beneficiaryName}`
          : `Virement de ${formattedAmount}`,
        content: body.description
          ? `${body.description} — ${formattedAmount}`
          : `Virement de ${formattedAmount} effectué avec succès.`,
        status: NewsStatus.TRANSACTION,
        metadata: {
          kind: 'TRANSFER',
          direction: 'OUT',
          status: 'COMPLETED',
          amount,
          currency: 'EUR',
          fees: 0,
          transactionId,
          executedAt: now.toISOString(),
          sourceAccountName: sourceAccount?.name ?? (body.sourceType === 'investment' ? 'Compte Investissement' : null),
          sourceIban: sourceAccount?.iban ?? null,
          destinationAccountName: destinationAccount?.name ?? null,
          destinationIban: destinationAccount?.iban ?? body.destinationIban ?? null,
          beneficiaryName,
          description: body.description ?? null,
        },
      });
    } catch {
      // Ne pas bloquer la réponse si la news échoue
    }

    return {
      success: true,
      message: result.message,
      sourceBalance: result.sourceBalance,
      destinationBalance: result.destinationBalance,
    };
  }
}
