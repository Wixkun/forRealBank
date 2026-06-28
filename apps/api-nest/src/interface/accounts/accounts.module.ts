import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AccountsController } from './accounts.controller';
import { AccountEntity } from '@forreal/infrastructure-typeorm';
import { InvestmentAccountEntity } from '@forreal/infrastructure-typeorm';

@Module({
  imports: [TypeOrmModule.forFeature([AccountEntity, InvestmentAccountEntity])],
  controllers: [AccountsController],
})
export class AccountsModule {}
