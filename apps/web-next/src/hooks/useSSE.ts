'use client';

import { useEffect, useRef, useState } from 'react';

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
  
  const onMessageRef = useRef(onMessage);
  const onErrorRef = useRef(onError);

  useEffect(() => {
    onMessageRef.current = onMessage;
    onErrorRef.current = onError;
  }, [onMessage, onError]);

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
        onMessageRef.current?.(parsedData);
      } catch (e) {
        console.error('Failed to parse SSE data:', e);
      }
    };

    eventSource.onerror = (err) => {
      setError(err);
      setIsConnected(false);
      onErrorRef.current?.(err);
      console.error('SSE error:', err);
    };

    return () => {
      eventSource.close();
      setIsConnected(false);
    };
  }, [url, enabled]);

  return { data, error, isConnected };
}

