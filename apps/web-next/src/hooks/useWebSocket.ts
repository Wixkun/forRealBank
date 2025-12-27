'use client';

import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';

interface UseWebSocketOptions {
  url: string;
  userId?: string;
  autoConnect?: boolean;
}

type SocketListener = (...args: unknown[]) => void;

export function useWebSocket({ url, userId, autoConnect = true }: UseWebSocketOptions) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const socketRef = useRef<Socket | null>(null);
  const listenersRef = useRef<Map<string, Set<(data?: unknown) => void>>>(new Map());

  useEffect(() => {
    if (!autoConnect) return;

    const newSocket = io(url, {
      query: { userId },
      transports: ['websocket'],
    });

    newSocket.on('connect', () => {
      setIsConnected(true);
      console.log('WebSocket connected');
      listenersRef.current.forEach((handlers, event) => {
        handlers.forEach((handler) => newSocket.on(event, handler));
      });
    });

    newSocket.on('disconnect', () => {
      setIsConnected(false);
      console.log('WebSocket disconnected');
    });

    socketRef.current = newSocket;
    setSocket(newSocket);

    const listenersSnapshot = listenersRef.current;

    return () => {
      listenersSnapshot.forEach((handlers, event) => {
        handlers.forEach((handler) => newSocket.off(event, handler));
      });
      newSocket.close();
    };
  }, [url, userId, autoConnect]);

  const emit = (event: string, data: unknown) => {
    if (socketRef.current) {
      socketRef.current.emit(event, data);
    }
  };

  const on = (event: string, handler: (data?: unknown) => void) => {
    let set = listenersRef.current.get(event);
    if (!set) {
      set = new Set();
      listenersRef.current.set(event, set);
    }
    set.add(handler);
    if (socketRef.current) {
      socketRef.current.on(event, handler);
    }
  };

  const off = (event: string, handler?: (data?: unknown) => void) => {
    const set = listenersRef.current.get(event);
    if (set) {
      if (handler) {
        set.delete(handler);
        if (socketRef.current) socketRef.current.off(event, handler as SocketListener);
      } else {
        set.forEach((h) => {
          if (socketRef.current) socketRef.current.off(event, h as SocketListener);
        });
        listenersRef.current.delete(event);
      }
    } else if (socketRef.current) {
      if (handler) {
        socketRef.current.off(event, handler as SocketListener);
      } else {
        socketRef.current.off(event);
      }
    }
  };

  return { socket, isConnected, emit, on, off };
}
