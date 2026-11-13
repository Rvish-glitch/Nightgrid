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

      // If not an explicit full ws:// or wss:// URL, resolve against backend env vars
      if (!targetUrl.startsWith('ws://') && !targetUrl.startsWith('wss://')) {
        const path = targetUrl ? (targetUrl.startsWith('/') ? targetUrl : `/${targetUrl}`) : '/ws/alerts';
        if (import.meta.env.VITE_WS_URL) {
          targetUrl = import.meta.env.VITE_WS_URL;
        } else if (import.meta.env.VITE_API_BASE_URL) {
          const base = import.meta.env.VITE_API_BASE_URL.replace(/\/$/, '');
          const wsProto = base.startsWith('https') ? 'wss:' : 'ws:';
          const host = base.replace(/^https?:\/\//, '');
          targetUrl = `${wsProto}//${host}${path}`;
        } else {
          const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
          const host = window.location.host;
          targetUrl = `${protocol}//${host}${path}`;
        }
      }

      console.log('[WebSocket] Connecting to:', targetUrl);
      const ws = new WebSocket(targetUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log('[WebSocket] Connected successfully to:', targetUrl);
        setIsConnected(true);
      };

      ws.onmessage = (event) => {
        try {
          const data: WebSocketAlertMessage = JSON.parse(event.data);
          console.log('[WebSocket] Alert received:', data);
          setLatestAlert(data);
          setMessages((prev) => [data, ...prev.slice(0, 49)]); // Keep last 50 alerts
        } catch (e) {
          console.error('Failed to parse WS message:', e);
        }
      };

      ws.onerror = (err) => {
        console.error('[WebSocket] Connection error:', targetUrl, err);
      };

      ws.onclose = (event) => {
        console.warn('[WebSocket] Closed (code: ' + event.code + ', reason: ' + event.reason + '). Reconnecting in 3s...');
        setIsConnected(false);
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
