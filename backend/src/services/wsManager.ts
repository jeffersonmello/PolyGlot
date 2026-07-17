import { WebSocketServer, WebSocket } from 'ws';
import http from 'http';
import { TranslationRecord } from '../types';
import { translationStore } from './translationStore';
import { logger } from '../utils/logger';

class WsManager {
  private wss: WebSocketServer | null = null;
  private subscriptions: Map<string, Set<WebSocket>> = new Map();

  init(server: http.Server): void {
    this.wss = new WebSocketServer({ server, path: '/ws' });

    this.wss.on('connection', (ws) => {
      logger.info('WebSocket client connected');

      ws.on('message', (data) => {
        try {
          const msg = JSON.parse(data.toString()) as { type: string; jobId?: string };
          if (msg.type === 'subscribe' && msg.jobId) {
            this.subscribe(ws, msg.jobId);
          }
        } catch {
          // ignore malformed messages
        }
      });

      ws.on('close', () => {
        logger.info('WebSocket client disconnected');
        this.unsubscribeAll(ws);
      });

      ws.on('error', (err) => {
        logger.error(`WebSocket error: ${err.message}`);
        this.unsubscribeAll(ws);
      });
    });

    logger.info('WebSocket server initialised at /ws');
  }

  private subscribe(ws: WebSocket, jobId: string): void {
    if (!this.subscriptions.has(jobId)) {
      this.subscriptions.set(jobId, new Set());
    }
    this.subscriptions.get(jobId)!.add(ws);

    // Send current status immediately so the client is up-to-date
    const record = translationStore.get(jobId);
    if (record && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type: 'job_update', data: record }));
    }
  }

  broadcast(jobId: string, record: TranslationRecord): void {
    const clients = this.subscriptions.get(jobId);
    if (!clients || clients.size === 0) return;

    const msg = JSON.stringify({ type: 'job_update', data: record });
    for (const ws of clients) {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(msg);
      } else {
        clients.delete(ws);
      }
    }
  }

  private unsubscribeAll(ws: WebSocket): void {
    for (const clients of this.subscriptions.values()) {
      clients.delete(ws);
    }
  }
}

export const wsManager = new WsManager();
