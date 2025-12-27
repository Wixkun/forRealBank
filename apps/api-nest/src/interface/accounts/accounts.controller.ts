import { Controller, Get, Param, UseGuards, Req } from '@nestjs/common';
import { Request } from 'express';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { BankAccountEntity } from '@forreal/infrastructure-typeorm/entities/BankAccountEntity';
import { BrokerageAccountEntity } from '@forreal/infrastructure-typeorm/entities/BrokerageAccountEntity';

@Controller('accounts')
@UseGuards(JwtAuthGuard)
export class AccountsController {
  constructor(
    @InjectRepository(BankAccountEntity)
    private readonly bankAccountRepo: Repository<BankAccountEntity>,
    @InjectRepository(BrokerageAccountEntity)
    private readonly brokerageAccountRepo: Repository<BrokerageAccountEntity>,
  ) {}

  @Get('bank')
  async getBankAccounts(@Req() req: Request) {
    const userId = (req.user as any).id;
    console.log('[AccountsController] getBankAccounts - userId:', userId);
    const accounts = await this.bankAccountRepo.find({
      where: { userId },
      order: { createdAt: 'ASC' },
    });
    console.log('[AccountsController] getBankAccounts - found', accounts.length, 'accounts');
    return accounts;
  }

  @Get('bank/:id')
  async getBankAccountById(@Param('id') id: string, @Req() req: Request) {
    const userId = (req.user as any).id;
    const account = await this.bankAccountRepo.findOne({
      where: { id, userId },
    });
    if (!account) {
      throw new Error('Account not found');
    }
    return account;
  }

  @Get('brokerage')
  async getBrokerageAccounts(@Req() req: Request) {
    const userId = (req.user as any).id;
    const accounts = await this.brokerageAccountRepo.find({
      where: { userId },
      order: { createdAt: 'ASC' },
    });
    return accounts;
  }

  @Get('brokerage/:id')
  async getBrokerageAccountById(@Param('id') id: string, @Req() req: Request) {
    const userId = (req.user as any).id;
    const account = await this.brokerageAccountRepo.findOne({
      where: { id, userId },
    });
    if (!account) {
      throw new Error('Account not found');
    }
    return account;
  }

  @Get()
  async getAllAccounts(@Req() req: Request) {
    const userId = (req.user as any).id;
    console.log('[AccountsController] getAllAccounts - userId:', userId);
    const bankAccounts = await this.bankAccountRepo.find({
      where: { userId },
      order: { createdAt: 'ASC' },
    });
    const brokerageAccounts = await this.brokerageAccountRepo.find({
      where: { userId },
      order: { createdAt: 'ASC' },
    });
    console.log('[AccountsController] getAllAccounts - bank:', bankAccounts.length, 'brokerage:', brokerageAccounts.length);

    return {
      bankAccounts: bankAccounts.map(acc => ({
        id: acc.id,
        name: acc.name,
        balance: parseFloat(acc.balance.toString()),
        iban: acc.iban,
        type: acc.accountType,
        accountType: 'banking',
      })),
      brokerageAccounts: brokerageAccounts.map(acc => ({
        id: acc.id,
        name: acc.name,
        balance: parseFloat(acc.balance.toString()),
        iban: acc.id,
        type: 'checking',
        accountType: 'brokerage',
      })),
    };
  }
}
