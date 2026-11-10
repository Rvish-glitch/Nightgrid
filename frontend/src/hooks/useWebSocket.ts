import { useState, useEffect, useRef, useCallback } from 'react';
import { WebSocketAlertMessage } from '../types';

export function useWebSocket(url: string = '/ws/alerts') {
  const [messages, setMessages] = useState<WebSocketAlertMessage[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [latestAlert, setLatestAlert] = useState<WebSocketAlertMessage | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<any>(null);

  const connect = useCallback(() => {
    try {
      // Determine protocol: ws: or wss: based on current location
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const host = window.location.host;
      const targetUrl = url.startsWith('ws') ? url : `${protocol}//${host}${url}`;

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
