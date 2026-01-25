import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AccountsController } from './accounts.controller';
import { BankAccountEntity } from '@forreal/infrastructure-typeorm';
import { BrokerageAccountEntity } from '@forreal/infrastructure-typeorm';

@Module({
  imports: [TypeOrmModule.forFeature([BankAccountEntity, BrokerageAccountEntity])],
  controllers: [AccountsController],
})
export class AccountsModule {}
