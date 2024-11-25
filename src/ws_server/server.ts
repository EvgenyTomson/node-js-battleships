import { WebSocketServer } from 'ws';
import { handleConnection } from './controllers/commandRouter';

let wss: WebSocketServer | null = null;

export const startWebSocketServer = (port: number) => {
  wss = new WebSocketServer({ port });

  console.log(`WebSocket server start on ws://localhost:${port}`);

  wss.on('connection', (ws) => {
    console.log('New connection');
    handleConnection(ws);
  });
};

export const getWebSocketServer = () => wss;
