import { WebSocket, WebSocketServer } from 'ws';
import {
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

export const handleConnection = (
  ws: ExtendedWebSocket,
  wss: WebSocketServer,
) => {
  ws.on('message', (message: string) => {
    try {
      const d = JSON.parse(message);
      // console.log(d, typeof d);
      const { type } = d;
      console.log('type: ', type);
      // const data = JSON.parse(d.data);

      switch (type) {
        case 'reg':
          const dataR = JSON.parse(d.data);
          // console.log('registration: ', dataR);
          // console.log('registration typeof data: ', typeof dataR);
          handlePlayerRegistration(ws, dataR);
          // console.log('registration player');
          break;
        case 'create_room':
          // console.log('create_room player: ', ws.playerData);
          handleRoomCreation(ws);
          break;
        case 'add_user_to_room':
          const dataA = JSON.parse(d.data);
          // console.log('add_user_to_room: ', dataA);
          handleAddUserToRoom(ws, wss, dataA);
          break;
        case 'update_room':
          broadcastRoomUpdate(wss);
          break;
        case 'add_ships':
          const dataS = JSON.parse(d.data);
          // console.log('add_ships: ');
          handleAddShips(ws, dataS);
          break;
        case 'attack':
          const dataAt = JSON.parse(d.data);
          console.log('attack: ', dataAt);
          handleAttack(ws, dataAt);
          break;
        case 'randomAttack':
          const dataRadAt = JSON.parse(d.data);
          dataRadAt.x = Math.trunc(Math.random() * 10);
          dataRadAt.y = Math.trunc(Math.random() * 10);
          console.log('randomAttack: ', dataRadAt);
          handleAttack(ws, dataRadAt);
          break;
        default:
          ws.send(JSON.stringify({ error: 'Unknown command' }));
      }
    } catch (error) {
      console.error('Error processing message:', error);
      ws.send(JSON.stringify({ error: 'Error processing message' }));
    }
  });
};
