import { Module } from '@nestjs/common';
import { TypeOrmModule, getRepositoryToken } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { TransactionsController } from './transactions.controller';
import {
  BankTransactionEntity,
  AccountEntity,
  InvestmentAccountEntity,
  InvestmentTransactionEntity,
  NotificationEntity,
  UserEntity,
  AccountRepository,
  InvestmentAccountRepository,
  TransferGateway,
} from '@forreal/infrastructure-typeorm';
import { ITransferGateway, IAccountRepository, IInvestmentRepository } from '@forreal/domain';
import { InitiateTransferUseCase } from '@forreal/application';
import { NewsModule } from '../feed/news.module';
import { TransfersSchemaBootstrapService } from './transfers-schema-bootstrap.service';
import { NotBannedGuard } from '../auth/not-banned.guard';

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
  providers: [
    TransfersSchemaBootstrapService,
    NotBannedGuard,
    {
      provide: ITransferGateway,
      useFactory: (dataSource: DataSource) => new TransferGateway(dataSource),
      inject: [DataSource],
    },
    {
      provide: InitiateTransferUseCase,
      useFactory: (
        accountRepo: Repository<AccountEntity>,
        investmentRepo: Repository<InvestmentAccountEntity>,
        gateway: ITransferGateway,
      ) => {
        const accounts: IAccountRepository = new AccountRepository(accountRepo);
        const investments: IInvestmentRepository = new InvestmentAccountRepository(investmentRepo);
        return new InitiateTransferUseCase(accounts, investments, gateway);
      },
      inject: [
        getRepositoryToken(AccountEntity),
        getRepositoryToken(InvestmentAccountEntity),
        ITransferGateway,
      ],
    },
  ],
})
export class TransactionsModule {}
