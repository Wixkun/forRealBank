import { Controller, Get, Param, Query, UseGuards, Req } from '@nestjs/common';
import { Request } from 'express';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { BankTransactionEntity } from '@forreal/infrastructure-typeorm/entities/BankTransactionEntity';
import { BankAccountEntity } from '@forreal/infrastructure-typeorm/entities/BankAccountEntity';

@Controller('transactions')
@UseGuards(JwtAuthGuard)
export class TransactionsController {
  constructor(
    @InjectRepository(BankTransactionEntity)
    private readonly transactionRepo: Repository<BankTransactionEntity>,
    @InjectRepository(BankAccountEntity)
    private readonly accountRepo: Repository<BankAccountEntity>,
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

    return transactions.map(t => ({
      id: t.id,
      type: t.type,
      description: t.description,
      date: t.createdAt.toISOString().split('T')[0],
      amount: t.type === 'credit' ? parseFloat(t.amount.toString()) : -Math.abs(parseFloat(t.amount.toString())),
      balance: parseFloat(t.balanceAfter.toString()),
    }));
  }

  @Get('recent')
  async getRecentTransactions(
    @Query('limit') limit: string = '10',
    @Req() req: Request,
  ) {
    const userId = (req.user as any).id;

    const accounts = await this.accountRepo.find({
      where: { userId },
      select: ['id'],
    });
    const accountIds = accounts.map(a => a.id);

    if (accountIds.length === 0) {
      return [];
    }

    const transactions = await this.transactionRepo
      .createQueryBuilder('transaction')
      .where('transaction.account_id IN (:...accountIds)', { accountIds })
      .orderBy('transaction.created_at', 'DESC')
      .limit(parseInt(limit))
      .getMany();

    return transactions.map(t => ({
      id: t.id,
      type: t.type,
      description: t.description,
      date: t.createdAt.toISOString().split('T')[0],
      amount: parseFloat(t.amount.toString()),
    }));
  }
}
