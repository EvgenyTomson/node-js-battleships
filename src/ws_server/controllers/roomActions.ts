import { WebSocket, WebSocketServer } from 'ws';
import { rooms } from '../utils/database';
import { ExtendedWebSocket } from './commandRouter';
import { sendMessageToRoomPlayers } from '../utils/utils';

export const handleAddUserToRoom = (
  ws: ExtendedWebSocket,
  wss: WebSocketServer,
  data: { indexRoom: number | string },
) => {
  if (!ws.playerData) return;

  const room = rooms.find((r) => r.roomId === Number(data.indexRoom));
  console.log('handleAddUserToRoom room: ', room);

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

        // TODO: need 1 more state for available rooms and remove root from it here
        // const roomIndex = rooms.findIndex((r) => r.roomId === room.roomId);
        // if (roomIndex !== -1) {
        //   rooms.splice(roomIndex, 1);
        // }

        broadcastRoomUpdate(wss);
      } else {
        broadcastRoomUpdate(wss);
      }
    } else {
      ws.send(JSON.stringify({ error: 'The room is already full' }));
    }
  } else {
    ws.send(JSON.stringify({ error: 'Room is not found' }));
  }
};

export const broadcastRoomUpdate = (wss: WebSocketServer) => {
  const availableRooms = rooms
    .filter((room) => room.players.length === 1)
    .map((room) => ({
      roomId: room.roomId,
      roomUsers: room.players.map((player) =>
        JSON.stringify({
          name: player.name,
          index: player.index,
        }),
      ),
    }));

  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(
        JSON.stringify({
          type: 'update_room',
          data: JSON.stringify(availableRooms),
          id: 0,
        }),
      );
    }
  });
};
