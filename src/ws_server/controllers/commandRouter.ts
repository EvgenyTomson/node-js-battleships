import { WebSocket } from 'ws';
import {
  handleClientDisconnection,
  handlePlayerRegistration,
  handleRoomCreation,
} from './playerController';
import { handleAttack, handleAddShips } from './gameActions';
import { broadcastRoomUpdate, handleAddUserToRoom } from './roomActions';

export interface PlayerData {
  name: string;
  index: number;
  wins: number;
}

export interface ExtendedWebSocket extends WebSocket {
  playerData?: PlayerData;
}

export const handleConnection = (ws: ExtendedWebSocket) => {
  ws.on('message', (message: string) => {
    try {
      const d = JSON.parse(message);
      const { type } = d;

      switch (type) {
        case 'reg': {
          const data = JSON.parse(d.data);
          handlePlayerRegistration(ws, data);
          break;
        }
        case 'create_room':
          handleRoomCreation(ws);
          break;
        case 'add_user_to_room': {
          const data = JSON.parse(d.data);
          handleAddUserToRoom(ws, data);
          break;
        }
        case 'update_room':
          broadcastRoomUpdate();
          break;
        case 'add_ships': {
          const data = JSON.parse(d.data);
          handleAddShips(ws, data);
          break;
        }
        case 'attack': {
          const data = JSON.parse(d.data);
          handleAttack(ws, data);
          break;
        }
        case 'randomAttack': {
          const data = JSON.parse(d.data);
          data.x = Math.trunc(Math.random() * 10);
          data.y = Math.trunc(Math.random() * 10);
          handleAttack(ws, data);
          break;
        }
        default:
          ws.send(JSON.stringify({ error: 'Unknown command' }));
      }
    } catch (error) {
      console.error('Error processing message:', error);
      ws.send(JSON.stringify({ error: 'Error processing message' }));
    }
  });
  ws.on('close', () => {
    handleClientDisconnection(ws);
  });
};
