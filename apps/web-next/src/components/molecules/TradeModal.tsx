'use client';

import { useTheme } from '@/contexts/ThemeContext';
import { TradeFormCard } from '@/components/molecules/TradeFormCard';

type TradeModalProps = {
  open: boolean;
  onClose: () => void;
  defaultSymbol?: string;
  onTrade: (data: {
    action: 'buy' | 'sell';
    symbol: string;
    quantity: number;
    orderType: 'market' | 'limit' | 'stop';
    price?: number;
  }) => void;
  labels: {
    title: string;
    buy: string;
    sell: string;
    symbol: string;
    quantity: string;
    orderType: string;
    price: string;
    placeOrder: string;
    orderTypes: {
      market: string;
      limit: string;
      stop: string;
    };
  };
};

export function TradeModal({ open, onClose, defaultSymbol, onTrade, labels }: TradeModalProps) {
  const { theme, mounted } = useTheme();
  const currentTheme = mounted ? theme : 'dark';

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        role="dialog"
        aria-modal="true"
        className={`relative w-full max-w-md mx-4 rounded-2xl border ${
          currentTheme === 'dark' ? 'border-gray-800' : 'border-gray-200'
        }`}
      >
        <button
          aria-label="Close"
          onClick={onClose}
          className={`absolute top-3 right-3 px-2 py-1 rounded-lg text-sm ${
            currentTheme === 'dark' ? 'bg-gray-800 text-gray-300' : 'bg-gray-100 text-gray-700'
          } hover:opacity-80`}
        >
          ✕
        </button>
        <TradeFormCard onTrade={onTrade} labels={labels} defaultSymbol={defaultSymbol} />
      </div>
    </div>
  );
}
