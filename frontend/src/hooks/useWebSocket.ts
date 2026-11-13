import { useState, useEffect, useRef, useCallback } from 'react';
import { WebSocketAlertMessage } from '../types';

export function useWebSocket(url?: string) {
  const [messages, setMessages] = useState<WebSocketAlertMessage[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [latestAlert, setLatestAlert] = useState<WebSocketAlertMessage | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<any>(null);

  const connect = useCallback(() => {
    try {
      let targetUrl = url || '';
      if (!targetUrl) {
        if (import.meta.env.VITE_WS_URL) {
          targetUrl = import.meta.env.VITE_WS_URL;
        } else if (import.meta.env.VITE_API_BASE_URL) {
          const base = import.meta.env.VITE_API_BASE_URL.replace(/\/$/, '');
          const wsProto = base.startsWith('https') ? 'wss:' : 'ws:';
          const host = base.replace(/^https?:\/\//, '');
          targetUrl = `${wsProto}//${host}/ws/alerts`;
        } else {
          const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
          const host = window.location.host;
          targetUrl = `${protocol}//${host}/ws/alerts`;
        }
      } else if (!targetUrl.startsWith('ws')) {
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const host = window.location.host;
        targetUrl = `${protocol}//${host}${targetUrl}`;
      }

      const ws = new WebSocket(targetUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        setIsConnected(true);
      };

      ws.onmessage = (event) => {
        try {
          const data: WebSocketAlertMessage = JSON.parse(event.data);
          setLatestAlert(data);
          setMessages((prev) => [data, ...prev.slice(0, 49)]); // Keep last 50 alerts
        } catch (e) {
          console.error('Failed to parse WS message:', e);
        }
      };

      ws.onclose = () => {
        setIsConnected(false);
        // Auto-reconnect after 3 seconds
        reconnectTimeoutRef.current = setTimeout(() => {
          connect();
        }, 3000);
      };

      ws.onerror = (err) => {
        console.warn('WebSocket error, waiting for reconnect...', err);
        ws.close();
      };
    } catch (err) {
      console.error('WebSocket connection initialization error:', err);
      reconnectTimeoutRef.current = setTimeout(connect, 3000);
    }
  }, [url]);

  useEffect(() => {
    connect();

    return () => {
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
      if (wsRef.current) wsRef.current.close();
    };
  }, [connect]);

  const clearAlerts = () => {
    setMessages([]);
    setLatestAlert(null);
  };

  return {
    messages,
    latestAlert,
    isConnected,
    clearAlerts,
  };
}
