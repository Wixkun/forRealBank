import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TransactionsController } from './transactions.controller';
import { BankTransactionEntity } from '@forreal/infrastructure-typeorm/entities/BankTransactionEntity';
import { BankAccountEntity } from '@forreal/infrastructure-typeorm/entities/BankAccountEntity';
import { BrokerageAccountEntity } from '@forreal/infrastructure-typeorm/entities/BrokerageAccountEntity';

@Module({
  imports: [
    TypeOrmModule.forFeature([BankTransactionEntity, BankAccountEntity, BrokerageAccountEntity]),
  ],
  controllers: [TransactionsController],
})
export class TransactionsModule {}
