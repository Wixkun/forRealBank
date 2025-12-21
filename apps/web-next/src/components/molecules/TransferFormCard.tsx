'use client';

import { useTheme } from '@/contexts/ThemeContext';
import { Button } from '@/components/ui/Button';

type TransferFormCardProps = {
  onSubmit: (data: { amount: string; recipient: string; description: string }) => void;
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

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    onSubmit({
      amount: formData.get('amount') as string,
      recipient: formData.get('recipient') as string,
      description: formData.get('description') as string,
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

      <form onSubmit={handleSubmit} className="space-y-4">
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
            name="amount"
            step="0.01"
            required
            className={`w-full px-4 py-3 rounded-xl border transition-colors ${
              currentTheme === 'dark'
                ? 'bg-gray-800 border-gray-700 text-white focus:border-teal-500'
                : 'bg-white border-gray-300 text-gray-900 focus:border-teal-500'
            } focus:outline-none focus:ring-2 focus:ring-teal-500/20`}
            placeholder="0.00"
          />
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
            name="recipient"
            required
            className={`w-full px-4 py-3 rounded-xl border transition-colors ${
              currentTheme === 'dark'
                ? 'bg-gray-800 border-gray-700 text-white focus:border-teal-500'
                : 'bg-white border-gray-300 text-gray-900 focus:border-teal-500'
            } focus:outline-none focus:ring-2 focus:ring-teal-500/20`}
            placeholder="FR76 XXXX XXXX XXXX XXXX XXXX XXX"
          />
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
            name="description"
            rows={3}
            className={`w-full px-4 py-3 rounded-xl border transition-colors resize-none ${
              currentTheme === 'dark'
                ? 'bg-gray-800 border-gray-700 text-white focus:border-teal-500'
                : 'bg-white border-gray-300 text-gray-900 focus:border-teal-500'
            } focus:outline-none focus:ring-2 focus:ring-teal-500/20`}
            placeholder="Optional description..."
          />
        </div>

        <Button
          type="submit"
          className="w-full bg-gradient-to-r from-teal-500 to-cyan-600 hover:from-teal-400 hover:to-cyan-500 text-white font-semibold py-3 rounded-xl transition-all hover:scale-[1.02]"
        >
          {labels.submit}
        </Button>
      </form>
    </div>
  );
}
