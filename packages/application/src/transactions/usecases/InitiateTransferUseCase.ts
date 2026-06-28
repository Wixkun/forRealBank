import { IAccountRepository } from '@forreal/domain';
import { IInvestmentRepository } from '@forreal/domain';
import { ITransactionRepository } from '@forreal/domain';
import { INotificationRepository, NotificationType } from '@forreal/domain';
import { Account } from '@forreal/domain';
import { InvestmentAccount } from '@forreal/domain';

export type TransferRequest = {
  userId: string;
  sourceType: 'bank' | 'investment';
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
    private readonly investmentRepo: IInvestmentRepository,
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
      const source = await this.accountRepo.findById(req.sourceAccountId);
      if (!source || source.userId !== req.userId) {
        return { success: false, message: 'Source account not found' };
      }

      if (source.accountType === 'savings' && req.destinationIban) {
        return { success: false, message: 'Savings cannot transfer to external IBAN' };
      }

      if (source.balance < amount) {
        return { success: false, message: 'Insufficient funds' };
      }

      let destinationBank: Account | null = null;
      let destinationInvestment: InvestmentAccount | null = null;

      if (req.destinationAccountId) {
        destinationBank = await this.accountRepo.findById(req.destinationAccountId);
        if (destinationBank && destinationBank.userId !== req.userId) {
          return { success: false, message: 'Destination not owned by user' };
        }
        if (!destinationBank) {
          destinationInvestment = await this.investmentRepo.findById(req.destinationAccountId);
          if (!destinationInvestment || destinationInvestment.userId !== req.userId) {
            return { success: false, message: 'Destination account not found' };
          }
        }
      } else if (req.destinationIban) {
        if (source.accountType !== 'checking') {
          return { success: false, message: 'Only checking can transfer to external IBAN' };
        }
        destinationBank = await this.accountRepo.findByIban(req.destinationIban);
        if (!destinationBank) {
          return { success: false, message: 'Recipient IBAN not found' };
        }
      } else {
        return { success: false, message: 'Missing destination' };
      }

      const newSourceBalance = Number((source.balance - amount).toFixed(2));
      await this.accountRepo.updateBalance(source.id, newSourceBalance);
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
        await this.accountRepo.updateBalance(destinationBank.id, newDestBalance);
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
      } else if (destinationInvestment) {
        const newDestBalance = Number((destinationInvestment.cashBalance + amount).toFixed(2));
        await this.investmentRepo.updateCashBalance(destinationInvestment.id, newDestBalance);
        await this.investmentRepo.createCashMovement({
          investmentAccountId: destinationInvestment.id,
          type: 'deposit',
          amount,
          cashBalanceAfter: newDestBalance,
          description: req.description || 'Transfer from bank account',
        });
        destinationBalanceUpdated = newDestBalance;
      }

      return {
        success: true,
        message: 'Transfer completed',
        sourceBalance: newSourceBalance,
        destinationBalance: destinationBalanceUpdated,
      };
    }

    const sourceInvestment = await this.investmentRepo.findById(req.sourceAccountId);
    if (!sourceInvestment || sourceInvestment.userId !== req.userId) {
      return { success: false, message: 'Investment source not found' };
    }

    if (sourceInvestment.cashBalance < amount) {
      return { success: false, message: 'Insufficient investment cash balance' };
    }

    if (req.destinationIban) {
      return { success: false, message: 'Investment account cannot transfer to external IBAN' };
    }

    if (!req.destinationAccountId) {
      return { success: false, message: 'Missing destination account for investment transfer' };
    }

    const destinationBank = await this.accountRepo.findById(req.destinationAccountId);
    const destinationInvestment = destinationBank
      ? null
      : await this.investmentRepo.findById(req.destinationAccountId);

    if (destinationBank && destinationBank.userId !== req.userId) {
      return { success: false, message: 'Destination not owned by user' };
    }
    if (destinationInvestment && destinationInvestment.userId !== req.userId) {
      return { success: false, message: 'Destination not owned by user' };
    }
    if (!destinationBank && !destinationInvestment) {
      return { success: false, message: 'Destination account not found' };
    }

    const newSourceBalance = Number((sourceInvestment.cashBalance - amount).toFixed(2));
    await this.investmentRepo.updateCashBalance(sourceInvestment.id, newSourceBalance);
    await this.investmentRepo.createCashMovement({
      investmentAccountId: sourceInvestment.id,
      type: 'withdrawal',
      amount,
      cashBalanceAfter: newSourceBalance,
      description: req.description || 'Transfer to bank account',
    });

    let destinationBalanceUpdated: number | undefined = undefined;

    if (destinationBank) {
      const newDestBalance = Number((destinationBank.balance + amount).toFixed(2));
      await this.accountRepo.updateBalance(destinationBank.id, newDestBalance);
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
    } else if (destinationInvestment) {
      const newDestBalance = Number((destinationInvestment.cashBalance + amount).toFixed(2));
      await this.investmentRepo.updateCashBalance(destinationInvestment.id, newDestBalance);
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
