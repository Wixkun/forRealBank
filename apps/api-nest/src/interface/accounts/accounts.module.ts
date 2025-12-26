import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AccountsController } from './accounts.controller';
import { BankAccountEntity } from '@forreal/infrastructure-typeorm/entities/BankAccountEntity';
import { BrokerageAccountEntity } from '@forreal/infrastructure-typeorm/entities/BrokerageAccountEntity';

@Module({
  imports: [
    TypeOrmModule.forFeature([BankAccountEntity, BrokerageAccountEntity]),
  ],
  controllers: [AccountsController],
})
export class AccountsModule {}
