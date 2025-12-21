'use client';

import { useState } from 'react';
import { useTheme } from '@/contexts/ThemeContext';
import { Button } from '@/components/ui/Button';
import { useSearchParams } from 'next/navigation';

type TradeFormCardProps = {
  onTrade: (data: {
    action: 'buy' | 'sell';
    symbol: string;
    quantity: number;
    orderType: 'market' | 'limit' | 'stop';
    price?: number;
  }) => void;
  defaultSymbol?: string;
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

export function TradeFormCard({ onTrade, labels, defaultSymbol }: TradeFormCardProps) {
  const { theme, mounted } = useTheme();
  const currentTheme = mounted ? theme : 'dark';
  const [action, setAction] = useState<'buy' | 'sell'>('buy');
  const [orderType, setOrderType] = useState<'market' | 'limit' | 'stop'>('market');
  const searchParams = useSearchParams();
  const initialSymbol = (defaultSymbol || searchParams?.get('symbol') || '').toUpperCase();

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    onTrade({
      action,
      symbol: formData.get('symbol') as string,
      quantity: Number(formData.get('quantity')),
      orderType,
      price: orderType !== 'market' ? Number(formData.get('price')) : undefined,
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

      <div className="flex gap-2 mb-6">
        <button
          type="button"
          onClick={() => setAction('buy')}
          className={`flex-1 py-3 rounded-xl font-semibold transition-all ${
            action === 'buy'
              ? 'bg-gradient-to-r from-teal-500 to-cyan-600 text-white'
              : currentTheme === 'dark'
              ? 'bg-gray-800 text-gray-300 hover:bg-gray-700'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          {labels.buy}
        </button>
        <button
          type="button"
          onClick={() => setAction('sell')}
          className={`flex-1 py-3 rounded-xl font-semibold transition-all ${
            action === 'sell'
              ? 'bg-gradient-to-r from-red-500 to-red-600 text-white'
              : currentTheme === 'dark'
              ? 'bg-gray-800 text-gray-300 hover:bg-gray-700'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          {labels.sell}
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label
            htmlFor="symbol"
            className={`block text-sm font-medium mb-2 ${
              currentTheme === 'dark' ? 'text-gray-300' : 'text-gray-700'
            }`}
          >
            {labels.symbol}
          </label>
          <input
            type="text"
            id="symbol"
            name="symbol"
            required
            className={`w-full px-4 py-3 rounded-xl border transition-colors uppercase ${
              currentTheme === 'dark'
                ? 'bg-gray-800 border-gray-700 text-white focus:border-teal-500'
                : 'bg-white border-gray-300 text-gray-900 focus:border-teal-500'
            } focus:outline-none focus:ring-2 focus:ring-teal-500/20`}
            placeholder="AAPL, BTC, etc."
            defaultValue={initialSymbol}
          />
        </div>

        <div>
          <label
            htmlFor="quantity"
            className={`block text-sm font-medium mb-2 ${
              currentTheme === 'dark' ? 'text-gray-300' : 'text-gray-700'
            }`}
          >
            {labels.quantity}
          </label>
          <input
            type="number"
            id="quantity"
            name="quantity"
            step="0.01"
            required
            className={`w-full px-4 py-3 rounded-xl border transition-colors ${
              currentTheme === 'dark'
                ? 'bg-gray-800 border-gray-700 text-white focus:border-teal-500'
                : 'bg-white border-gray-300 text-gray-900 focus:border-teal-500'
            } focus:outline-none focus:ring-2 focus:ring-teal-500/20`}
            placeholder="1"
          />
        </div>

        <div>
          <label
            className={`block text-sm font-medium mb-2 ${
              currentTheme === 'dark' ? 'text-gray-300' : 'text-gray-700'
            }`}
          >
            {labels.orderType}
          </label>
          <div className="flex gap-2">
            {(['market', 'limit', 'stop'] as const).map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => setOrderType(type)}
                className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
                  orderType === type
                    ? 'bg-teal-500 text-white'
                    : currentTheme === 'dark'
                    ? 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {labels.orderTypes[type]}
              </button>
            ))}
          </div>
        </div>

        {orderType !== 'market' && (
          <div>
            <label
              htmlFor="price"
              className={`block text-sm font-medium mb-2 ${
                currentTheme === 'dark' ? 'text-gray-300' : 'text-gray-700'
              }`}
            >
              {labels.price}
            </label>
            <input
              type="number"
              id="price"
              name="price"
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
        )}

        <Button
          type="submit"
          className={`w-full font-semibold py-3 rounded-xl transition-all hover:scale-[1.02] ${
            action === 'buy'
              ? 'bg-gradient-to-r from-teal-500 to-cyan-600 hover:from-teal-400 hover:to-cyan-500 text-white'
              : 'bg-gradient-to-r from-red-500 to-red-600 hover:from-red-400 hover:to-red-500 text-white'
          }`}
        >
          {labels.placeOrder}
        </Button>
      </form>
    </div>
  );
}
