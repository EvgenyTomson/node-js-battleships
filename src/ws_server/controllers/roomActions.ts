import { WebSocket } from 'ws';
import { rooms, wsClients } from '../utils/database';
import { ExtendedWebSocket } from './commandRouter';
import { sendMessageToRoomPlayers } from '../utils/utils';

export const handleAddUserToRoom = (
  ws: ExtendedWebSocket,
  data: { indexRoom: number | string },
) => {
  if (!ws.playerData) return;

  const room = rooms.find((r) => r.roomId === Number(data.indexRoom));

  if (room) {
    if (room.players.length < 2) {
      room.players.push({
        name: ws.playerData.name,
        index: ws.playerData.index,
        wins: ws.playerData.wins,
      });

      if (room.players.length === 2) {
        room.gameStarted = true;
        room.currentTurn = room.players[0].index;
        sendMessageToRoomPlayers(room, 'create');
      }
      broadcastRoomUpdate();
    } else {
      ws.send(JSON.stringify({ error: 'The room is already full' }));
    }
  } else {
    ws.send(JSON.stringify({ error: 'Room is not found' }));
  }
};

export const broadcastRoomUpdate = () => {
  const availableRooms = rooms
    .filter((room) => room.players.length === 1)
    .map((room) => ({
      roomId: room.roomId,
      roomUsers: room.players,
    }));

  for (const [client] of wsClients) {
    if (client.readyState === WebSocket.OPEN) {
      client.send(
        JSON.stringify({
          type: 'update_room',
          data: JSON.stringify(availableRooms),
          id: 0,
        }),
      );
    }
  }
};
