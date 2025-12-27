'use client';

import { useState } from 'react';
import { useTheme } from '@/contexts/ThemeContext';
import { Button } from '@/components/ui/Button';
import { useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { tradeSchema, TradeFormData } from '@/lib/schemas/trade.schema';
import { z } from 'zod';

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

type TradeFormInput = z.input<typeof tradeSchema>;

export function TradeFormCard({ onTrade, labels, defaultSymbol }: TradeFormCardProps) {
  const { theme, mounted } = useTheme();
  const currentTheme = mounted ? theme : 'dark';
  const [action, setAction] = useState<'buy' | 'sell'>('buy');
  const searchParams = useSearchParams();
  const initialSymbol = (defaultSymbol || searchParams?.get('symbol') || '').toUpperCase();

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<TradeFormInput, unknown, TradeFormData>({
    resolver: zodResolver(tradeSchema),
    defaultValues: {
      symbol: initialSymbol,
      orderType: 'market',
    },
  });

  const orderType = watch('orderType');

  const onSubmitForm = (data: TradeFormData) => {
    onTrade({
      action,
      symbol: data.symbol,
      quantity: data.quantity,
      orderType: data.orderType,
      price: data.price,
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

      <form onSubmit={handleSubmit(onSubmitForm)} className="space-y-4">
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
            {...register('symbol')}
            className={`w-full px-4 py-3 rounded-xl border transition-colors uppercase ${
              errors.symbol
                ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20'
                : currentTheme === 'dark'
                ? 'bg-gray-800 border-gray-700 text-white focus:border-teal-500'
                : 'bg-white border-gray-300 text-gray-900 focus:border-teal-500'
            } focus:outline-none focus:ring-2 focus:ring-teal-500/20`}
            placeholder="AAPL, BTC, etc."
          />
          {errors.symbol && (
            <p className="mt-1 text-sm text-red-500">{errors.symbol.message}</p>
          )}
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
            step="0.01"
            {...register('quantity')}
            className={`w-full px-4 py-3 rounded-xl border transition-colors ${
              errors.quantity
                ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20'
                : currentTheme === 'dark'
                ? 'bg-gray-800 border-gray-700 text-white focus:border-teal-500'
                : 'bg-white border-gray-300 text-gray-900 focus:border-teal-500'
            } focus:outline-none focus:ring-2 focus:ring-teal-500/20`}
            placeholder="1"
          />
          {errors.quantity && (
            <p className="mt-1 text-sm text-red-500">{errors.quantity.message}</p>
          )}
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
              <label
                key={type}
                className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all cursor-pointer text-center ${
                  orderType === type
                    ? 'bg-teal-500 text-white'
                    : currentTheme === 'dark'
                    ? 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <input
                  type="radio"
                  value={type}
                  {...register('orderType')}
                  className="sr-only"
                />
                {labels.orderTypes[type]}
              </label>
            ))}
          </div>
          {errors.orderType && (
            <p className="mt-1 text-sm text-red-500">{errors.orderType.message}</p>
          )}
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
              step="0.01"
              {...register('price')}
              className={`w-full px-4 py-3 rounded-xl border transition-colors ${
                errors.price
                  ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20'
                  : currentTheme === 'dark'
                  ? 'bg-gray-800 border-gray-700 text-white focus:border-teal-500'
                  : 'bg-white border-gray-300 text-gray-900 focus:border-teal-500'
              } focus:outline-none focus:ring-2 focus:ring-teal-500/20`}
              placeholder="0.00"
            />
            {errors.price && (
              <p className="mt-1 text-sm text-red-500">{errors.price.message}</p>
            )}
          </div>
        )}

        <Button
          type="submit"
          disabled={isSubmitting}
          className={`w-full font-semibold py-3 rounded-xl transition-all hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed ${
            action === 'buy'
              ? 'bg-gradient-to-r from-teal-500 to-cyan-600 hover:from-teal-400 hover:to-cyan-500 text-white'
              : 'bg-gradient-to-r from-red-500 to-red-600 hover:from-red-400 hover:to-red-500 text-white'
          }`}
        >
          {isSubmitting ? 'Processing...' : labels.placeOrder}
        </Button>
      </form>
    </div>
  );
}
