import { WebSocketServer } from 'ws';
import { handleConnection } from './controllers/commandRouter';

const PORT = 3000;
export const wss = new WebSocketServer({ port: PORT });

console.log(`WebSocket server start on ws://localhost:${PORT}`);

wss.on('connection', (ws) => {
  console.log('New connection');
  handleConnection(ws, wss);
});

process.on('SIGINT', () => {
  console.log('Shooting down the server');
  wss.close(() => {
    console.log('WebSocket server is offline');
    process.exit(0);
  });
});
