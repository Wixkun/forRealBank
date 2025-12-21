'use client';

import { useState, useEffect, useCallback } from 'react';

type MarketData = {
  [symbol: string]: {
    price: number;
    change24h: number;
  };
};

export function useMarketData(symbols: string[], intervalMs: number = 30000) {
  const [data, setData] = useState<MarketData>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (symbols.length === 0) return;

    try {
      const response = await fetch(`/api/market-data?symbols=${symbols.join(',')}`);
      const result = await response.json();

      if (result.success) {
        setData(result.data);
        setError(null);
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError('Failed to fetch market data');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [symbols]);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, intervalMs);
    return () => clearInterval(interval);
  }, [fetchData, intervalMs]);

  return { data, loading, error, refresh: fetchData };
}
