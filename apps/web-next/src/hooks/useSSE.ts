'use client';

import { useEffect, useState } from 'react';

interface UseSSEOptions<T> {
  url: string;
  enabled?: boolean;
  onMessage?: (data: T) => void;
  onError?: (error: Event) => void;
}

export function useSSE<T = unknown>({ url, enabled = true, onMessage, onError }: UseSSEOptions<T>) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<Event | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (!enabled) return;

    const eventSource = new EventSource(url);

    eventSource.onopen = () => {
      setIsConnected(true);
      console.log('SSE connected:', url);
    };

    eventSource.onmessage = (event) => {
      try {
        const parsedData = JSON.parse(event.data);
        setData(parsedData);
        onMessage?.(parsedData);
      } catch (e) {
        console.error('Failed to parse SSE data:', e);
      }
    };

    eventSource.onerror = (err) => {
      setError(err);
      setIsConnected(false);
      onError?.(err);
      console.error('SSE error:', err);
    };

    return () => {
      eventSource.close();
      setIsConnected(false);
    };
  }, [url, enabled, onMessage, onError]);

  return { data, error, isConnected };
}
