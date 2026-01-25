import { IAccountRepository } from '@forreal/domain';
import { IBrokerageRepository } from '@forreal/domain';
import { ITransactionRepository } from '@forreal/domain';
import { INotificationRepository, NotificationType } from '@forreal/domain';
import { BankAccount } from '@forreal/domain';
import { BrokerageAccount } from '@forreal/domain';

export type TransferRequest = {
  userId: string;
  sourceType: 'bank' | 'brokerage';
  sourceAccountId: string;
  destinationAccountId?: string;
  destinationIban?: string;
  amount: number;
  description?: string;
};

export type TransferResult = {
  success: boolean;
  message: string;
  sourceBalance?: number;
  destinationBalance?: number;
};

export class InitiateTransferUseCase {
  constructor(
    private readonly accountRepo: IAccountRepository,
    private readonly brokerageRepo: IBrokerageRepository,
    private readonly transactionRepo: ITransactionRepository,
    private readonly notificationRepo: INotificationRepository,
  ) {}

  async execute(req: TransferRequest): Promise<TransferResult> {
    if (!req.amount || req.amount <= 0) {
      return { success: false, message: 'Invalid amount' };
    }

    if (!req.sourceAccountId) {
      return { success: false, message: 'Missing source account' };
    }

    const amount = Number(req.amount);

    if (req.sourceType === 'bank') {
      const source = await this.accountRepo.findBankAccountById(req.sourceAccountId);
      if (!source || source.userId !== req.userId) {
        return { success: false, message: 'Source account not found' };
      }

      if (source.accountType === 'savings' && req.destinationIban) {
        return { success: false, message: 'Savings cannot transfer to external IBAN' };
      }

      if (source.balance < amount) {
        return { success: false, message: 'Insufficient funds' };
      }

      let destinationBank: BankAccount | null = null;
      let destinationBrokerage: BrokerageAccount | null = null;

      if (req.destinationAccountId) {
        destinationBank = await this.accountRepo.findBankAccountById(req.destinationAccountId);
        if (destinationBank && destinationBank.userId !== req.userId) {
          return { success: false, message: 'Destination not owned by user' };
        }
        if (!destinationBank) {
          destinationBrokerage = await this.brokerageRepo.findById(req.destinationAccountId);
          if (!destinationBrokerage || destinationBrokerage.userId !== req.userId) {
            return { success: false, message: 'Destination account not found' };
          }
        }
      } else if (req.destinationIban) {
        if (source.accountType !== 'checking') {
          return { success: false, message: 'Only checking can transfer to external IBAN' };
        }
        destinationBank = await this.accountRepo.findBankAccountByIban(req.destinationIban);
        if (!destinationBank) {
          return { success: false, message: 'Recipient IBAN not found' };
        }
      } else {
        return { success: false, message: 'Missing destination' };
      }

      const newSourceBalance = Number((source.balance - amount).toFixed(2));
      await this.accountRepo.updateBankAccountBalance(source.id, newSourceBalance);
      await this.transactionRepo.createBankTransaction({
        accountId: source.id,
        type: 'debit',
        description: req.description || 'Transfer',
        amount: -amount,
        balanceAfter: newSourceBalance,
      });

      let destinationBalanceUpdated: number | undefined = undefined;

      if (destinationBank) {
        const newDestBalance = Number((destinationBank.balance + amount).toFixed(2));
        await this.accountRepo.updateBankAccountBalance(destinationBank.id, newDestBalance);
        await this.transactionRepo.createBankTransaction({
          accountId: destinationBank.id,
          type: 'transfer',
          description: req.description || 'Incoming transfer',
          amount: amount,
          balanceAfter: newDestBalance,
        });
        destinationBalanceUpdated = newDestBalance;

        await this.notificationRepo.create(
          destinationBank.userId,
          'Virement reçu',
          `Vous avez reçu un virement de ${amount.toFixed(2)}€. ${req.description || ''}`,
          NotificationType.TRANSFER_RECEIVED,
        );
      } else if (destinationBrokerage) {
        const newDestBalance = Number((destinationBrokerage.balance + amount).toFixed(2));
        await this.brokerageRepo.updateCashBalance(destinationBrokerage.id, newDestBalance);
        destinationBalanceUpdated = newDestBalance;
      }

      return {
        success: true,
        message: 'Transfer completed',
        sourceBalance: newSourceBalance,
        destinationBalance: destinationBalanceUpdated,
      };
    }

    const sourceBrokerage = await this.brokerageRepo.findById(req.sourceAccountId);
    if (!sourceBrokerage || sourceBrokerage.userId !== req.userId) {
      return { success: false, message: 'Brokerage source not found' };
    }

    if (sourceBrokerage.balance < amount) {
      return { success: false, message: 'Insufficient brokerage cash' };
    }

    if (req.destinationIban) {
      return { success: false, message: 'Brokerage cannot transfer to external IBAN' };
    }

    if (!req.destinationAccountId) {
      return { success: false, message: 'Missing destination account for brokerage transfer' };
    }

    const destinationBank = await this.accountRepo.findBankAccountById(req.destinationAccountId);
    const destinationBrokerage = destinationBank
      ? null
      : await this.brokerageRepo.findById(req.destinationAccountId);

    if (destinationBank && destinationBank.userId !== req.userId) {
      return { success: false, message: 'Destination not owned by user' };
    }
    if (destinationBrokerage && destinationBrokerage.userId !== req.userId) {
      return { success: false, message: 'Destination not owned by user' };
    }
    if (!destinationBank && !destinationBrokerage) {
      return { success: false, message: 'Destination account not found' };
    }

    const newSourceBalance = Number((sourceBrokerage.balance - amount).toFixed(2));
    await this.brokerageRepo.updateCashBalance(sourceBrokerage.id, newSourceBalance);

    let destinationBalanceUpdated: number | undefined = undefined;

    if (destinationBank) {
      const newDestBalance = Number((destinationBank.balance + amount).toFixed(2));
      await this.accountRepo.updateBankAccountBalance(destinationBank.id, newDestBalance);
      await this.transactionRepo.createBankTransaction({
        accountId: destinationBank.id,
        type: 'transfer',
        description: req.description || 'Incoming transfer',
        amount: amount,
        balanceAfter: newDestBalance,
      });
      destinationBalanceUpdated = newDestBalance;

      await this.notificationRepo.create(
        destinationBank.userId,
        'Virement reçu',
        `Vous avez reçu un virement de ${amount.toFixed(2)}€. ${req.description || ''}`,
        NotificationType.TRANSFER_RECEIVED,
      );
    } else if (destinationBrokerage) {
      const newDestBalance = Number((destinationBrokerage.balance + amount).toFixed(2));
      await this.brokerageRepo.updateCashBalance(destinationBrokerage.id, newDestBalance);
      destinationBalanceUpdated = newDestBalance;
    }

    return {
      success: true,
      message: 'Transfer completed',
      sourceBalance: newSourceBalance,
      destinationBalance: destinationBalanceUpdated,
    };
  }
}
