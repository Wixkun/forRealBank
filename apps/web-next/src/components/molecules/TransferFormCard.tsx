'use client';

import { useTheme } from '@/contexts/ThemeContext';
import { Button } from '@/components/ui/Button';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { transferSchema, TransferFormData } from '@/lib/schemas/transfer.schema';

type TransferFormCardProps = {
  onSubmit: (data: { amount: string; recipient: string; description?: string }) => void;
  labels: {
    title: string;
    amount: string;
    recipient: string;
    description: string;
    submit: string;
  };
};

export function TransferFormCard({ onSubmit, labels }: TransferFormCardProps) {
  const { theme, mounted } = useTheme();
  const currentTheme = mounted ? theme : 'dark';

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<TransferFormData>({
    resolver: zodResolver(transferSchema),
  });

  const onSubmitForm = (data: TransferFormData) => {
    onSubmit({
      amount: data.amount,
      recipient: data.recipient,
      description: data.description,
    });
  };

  return (
    <div
      className={`p-6 rounded-2xl border transition-colors ${
        currentTheme === 'dark'
          ? 'bg-gray-900/50 border-gray-800'
          : 'bg-white border-gray-200'
      }`}
    >
      <h3
        className={`text-xl font-semibold mb-6 ${
          currentTheme === 'dark' ? 'text-white' : 'text-gray-900'
        }`}
      >
        {labels.title}
      </h3>

      <form onSubmit={handleSubmit(onSubmitForm)} className="space-y-4">
        <div>
          <label
            htmlFor="amount"
            className={`block text-sm font-medium mb-2 ${
              currentTheme === 'dark' ? 'text-gray-300' : 'text-gray-700'
            }`}
          >
            {labels.amount}
          </label>
          <input
            type="number"
            id="amount"
            step="0.01"
            {...register('amount')}
            className={`w-full px-4 py-3 rounded-xl border transition-colors ${
              errors.amount
                ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20'
                : currentTheme === 'dark'
                ? 'bg-gray-800 border-gray-700 text-white focus:border-teal-500'
                : 'bg-white border-gray-300 text-gray-900 focus:border-teal-500'
            } focus:outline-none focus:ring-2 focus:ring-teal-500/20`}
            placeholder="0.00"
          />
          {errors.amount && (
            <p className="mt-1 text-sm text-red-500">{errors.amount.message}</p>
          )}
        </div>

        <div>
          <label
            htmlFor="recipient"
            className={`block text-sm font-medium mb-2 ${
              currentTheme === 'dark' ? 'text-gray-300' : 'text-gray-700'
            }`}
          >
            {labels.recipient}
          </label>
          <input
            type="text"
            id="recipient"
            {...register('recipient')}
            className={`w-full px-4 py-3 rounded-xl border transition-colors ${
              errors.recipient
                ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20'
                : currentTheme === 'dark'
                ? 'bg-gray-800 border-gray-700 text-white focus:border-teal-500'
                : 'bg-white border-gray-300 text-gray-900 focus:border-teal-500'
            } focus:outline-none focus:ring-2 focus:ring-teal-500/20`}
            placeholder="FR76 XXXX XXXX XXXX XXXX XXXX XXX"
          />
          {errors.recipient && (
            <p className="mt-1 text-sm text-red-500">{errors.recipient.message}</p>
          )}
        </div>

        <div>
          <label
            htmlFor="description"
            className={`block text-sm font-medium mb-2 ${
              currentTheme === 'dark' ? 'text-gray-300' : 'text-gray-700'
            }`}
          >
            {labels.description}
          </label>
          <textarea
            id="description"
            rows={3}
            {...register('description')}
            className={`w-full px-4 py-3 rounded-xl border transition-colors resize-none ${
              errors.description
                ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20'
                : currentTheme === 'dark'
                ? 'bg-gray-800 border-gray-700 text-white focus:border-teal-500'
                : 'bg-white border-gray-300 text-gray-900 focus:border-teal-500'
            } focus:outline-none focus:ring-2 focus:ring-teal-500/20`}
            placeholder="Optional description..."
          />
          {errors.description && (
            <p className="mt-1 text-sm text-red-500">{errors.description.message}</p>
          )}
        </div>

        <Button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-gradient-to-r from-teal-500 to-cyan-600 hover:from-teal-400 hover:to-cyan-500 text-white font-semibold py-3 rounded-xl transition-all hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? 'Processing...' : labels.submit}
        </Button>
      </form>
    </div>
  );
}
