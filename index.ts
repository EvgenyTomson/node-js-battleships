import { httpServer } from './src/http_server/index';
import {
  startWebSocketServer,
  getWebSocketServer,
} from './src/ws_server/server';

const HTTP_PORT = 8181;
const WS_PORT = 3000;

console.log(`Start static http server on the ${HTTP_PORT} port!`);
httpServer.listen(HTTP_PORT);

startWebSocketServer(WS_PORT);

process.on('SIGINT', () => {
  console.log('Shooting down servers...');

  httpServer.close(() => {
    console.log('HTTP server stopped');
  });

  const wss = getWebSocketServer();
  if (wss) {
    wss.close(() => {
      console.log('WebSocket server stopped');
      process.exit(0);
    });
  } else {
    process.exit(0);
  }
});
