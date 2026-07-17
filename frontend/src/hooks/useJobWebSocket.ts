import { useEffect, useRef, useState } from 'react';
import type { TranslationRecord } from '../types';

function getWsUrl(): string {
  const apiUrl = import.meta.env.VITE_API_URL as string | undefined;
  if (apiUrl) {
    return apiUrl.replace(/^http/, 'ws').replace(/\/api\/?$/, '/ws');
  }
  if (import.meta.env.DEV) {
    return 'ws://localhost:3001/ws';
  }
  const proto = window.location.protocol === 'https:' ? 'wss' : 'ws';
  return `${proto}://${window.location.host}/ws`;
}

interface WsMessage {
  type: string;
  data?: TranslationRecord;
}

/**
 * Connects to the backend WebSocket and subscribes to real-time job updates.
 * Falls back gracefully: if the socket closes before the job completes, the
 * hook stops updating but does NOT throw – the caller can poll as fallback.
 */
export function useJobWebSocket(
  jobId: string | null
): { job: TranslationRecord | null; error: string | null } {
  const [job, setJob] = useState<TranslationRecord | null>(null);
  const [error, setError] = useState<string | null>(null);
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    if (!jobId) {
      setJob(null);
      setError(null);
      return;
    }

    const url = getWsUrl();
    let ws: WebSocket;

    try {
      ws = new WebSocket(url);
    } catch (err) {
      setError((err as Error).message);
      return;
    }

    wsRef.current = ws;

    ws.onopen = () => {
      ws.send(JSON.stringify({ type: 'subscribe', jobId }));
    };

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data as string) as WsMessage;
        if (msg.type === 'job_update' && msg.data) {
          setJob(msg.data);
        }
      } catch {
        // ignore malformed frames
      }
    };

    ws.onerror = () => {
      setError('WebSocket connection error – status updates unavailable');
    };

    ws.onclose = () => {
      wsRef.current = null;
    };

    return () => {
      ws.close();
      wsRef.current = null;
    };
  }, [jobId]);

  return { job, error };
}
