import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TransactionsController } from './transactions.controller';
import { BankTransactionEntity } from '@forreal/infrastructure-typeorm';
import { BankAccountEntity } from '@forreal/infrastructure-typeorm';
import { BrokerageAccountEntity } from '@forreal/infrastructure-typeorm';
import { NotificationEntity } from '@forreal/infrastructure-typeorm';
import { UserEntity } from '@forreal/infrastructure-typeorm';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      BankTransactionEntity,
      BankAccountEntity,
      BrokerageAccountEntity,
      NotificationEntity,
      UserEntity,
    ]),
  ],
  controllers: [TransactionsController],
})
export class TransactionsModule {}
