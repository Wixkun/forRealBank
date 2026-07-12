import { Controller, Get, UseGuards, Req } from '@nestjs/common';
import { Request } from 'express';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AccountEntity } from '@forreal/infrastructure-typeorm';
import { InvestmentAccountEntity } from '@forreal/infrastructure-typeorm';

@Controller('accounts')
@UseGuards(JwtAuthGuard)
export class AccountsController {
  constructor(
    @InjectRepository(AccountEntity)
    private readonly accountRepo: Repository<AccountEntity>,
    @InjectRepository(InvestmentAccountEntity)
    private readonly investmentAccountRepo: Repository<InvestmentAccountEntity>,
  ) {}

  // Vue synthétique consommée par le dashboard : comptes bancaires +
  // investissement de l'utilisateur authentifié, montants normalisés en number.
  @Get('all/summary')
  async getAllAccountsSummary(@Req() req: Request) {
    const userId = (req.user as { id: string }).id;
    const [accounts, investmentAccounts] = await Promise.all([
      this.accountRepo.find({ where: { userId }, order: { createdAt: 'ASC' } }),
      this.investmentAccountRepo.find({ where: { userId }, order: { createdAt: 'ASC' } }),
    ]);

    return {
      accounts: accounts.map((acc) => ({
        id: acc.id,
        name: acc.name,
        balance: parseFloat(acc.balance.toString()),
        iban: acc.iban,
        type: acc.accountType,
        interestRate: acc.interestRate !== null ? parseFloat(acc.interestRate.toString()) : null,
        accountCategory: 'banking',
      })),
      investmentAccounts: investmentAccounts.map((acc) => ({
        id: acc.id,
        name: acc.name,
        cashBalance: parseFloat(acc.cashBalance.toString()),
        totalValue: parseFloat(acc.totalValue.toString()),
        totalGainLoss: parseFloat(acc.totalGainLoss.toString()),
        accountCategory: 'investment',
      })),
    };
  }
}
