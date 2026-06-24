import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TransactionsController } from './transactions.controller';
import {
  BankTransactionEntity,
  AccountEntity,
  InvestmentAccountEntity,
  InvestmentTransactionEntity,
  NotificationEntity,
  UserEntity,
} from '@forreal/infrastructure-typeorm';
import { NewsModule } from '../feed/news.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      BankTransactionEntity,
      AccountEntity,
      InvestmentAccountEntity,
      InvestmentTransactionEntity,
      NotificationEntity,
      UserEntity,
    ]),
    NewsModule,
  ],
  controllers: [TransactionsController],
})
export class TransactionsModule {}
