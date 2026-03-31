'use client';

import { useEffect, useRef, useState } from 'react';

interface UseSSEOptions<T> {
  url: string;
  enabled?: boolean;
  withCredentials?: boolean;
  retryMs?: number;
  maxRetryMs?: number;
  onMessage?: (data: T) => void;
  onError?: (error: Event) => void;
}

export function useSSE<T = unknown>({
  url,
  enabled = true,
  withCredentials = false,
  retryMs = 1000,
  maxRetryMs = 15000,
  onMessage,
  onError,
}: UseSSEOptions<T>) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<Event | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  const onMessageRef = useRef(onMessage);
  const onErrorRef = useRef(onError);

  const retryTimerRef = useRef<number | null>(null);
  const retryDelayRef = useRef(retryMs);
  const eventSourceRef = useRef<EventSource | null>(null);

  useEffect(() => {
    onMessageRef.current = onMessage;
    onErrorRef.current = onError;
  }, [onMessage, onError]);

  useEffect(() => {
    if (!enabled) return;

    let cancelled = false;

    const cleanup = () => {
      if (retryTimerRef.current != null) {
        window.clearTimeout(retryTimerRef.current);
        retryTimerRef.current = null;
      }
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
      setIsConnected(false);
    };

    const connect = () => {
      if (cancelled) return;

      cleanup();

      // reset error state on new attempt
      setError(null);

      const es = new EventSource(url, { withCredentials });
      eventSourceRef.current = es;

      es.onopen = () => {
        if (cancelled) return;
        retryDelayRef.current = retryMs;
        setIsConnected(true);
        if (process.env.NODE_ENV !== 'production') {
          console.log('SSE connected:', url);
        }
      };

      es.onmessage = (event) => {
        try {
          const parsedData = JSON.parse(event.data);
          setData(parsedData);
          onMessageRef.current?.(parsedData);
        } catch (e) {
          console.error('Failed to parse SSE data:', e);
        }
      };

      es.onerror = (err) => {
        if (cancelled) return;

        setError(err);
        setIsConnected(false);
        onErrorRef.current?.(err);

        const state = eventSourceRef.current?.readyState;
        const delay = retryDelayRef.current;

        // En dev, l'erreur peut être vide {} => on log contexte utile.
        if (process.env.NODE_ENV !== 'production') {
          console.error('SSE error:', { url, readyState: state, retryInMs: delay, err });
        }

        // Reconnexion avec backoff (évite un spam qui peut ralentir l'app)
        retryTimerRef.current = window.setTimeout(() => {
          retryDelayRef.current = Math.min(retryDelayRef.current * 2, maxRetryMs);
          connect();
        }, delay);

        // Ferme explicitement pour éviter une boucle interne d'EventSource + notre backoff
        try {
          es.close();
        } catch {
          // ignore
        }
      };
    };

    connect();

    return () => {
      cancelled = true;
      cleanup();
    };
  }, [url, enabled, withCredentials, retryMs, maxRetryMs]);

  return { data, error, isConnected };
}
