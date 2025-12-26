import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TransactionsController } from './transactions.controller';
import { BankTransactionEntity } from '@forreal/infrastructure-typeorm/entities/BankTransactionEntity';
import { BankAccountEntity } from '@forreal/infrastructure-typeorm/entities/BankAccountEntity';

@Module({
  imports: [
    TypeOrmModule.forFeature([BankTransactionEntity, BankAccountEntity]),
  ],
  controllers: [TransactionsController],
})
export class TransactionsModule {}
