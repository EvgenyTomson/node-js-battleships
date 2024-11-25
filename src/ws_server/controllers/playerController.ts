import { players, rooms, wsClients } from '../utils/database';
import { Player, Room } from '../utils/types';
import { ExtendedWebSocket } from './commandRouter';
import { broadcastRoomUpdate } from './roomActions';

export const handlePlayerRegistration = (
  ws: ExtendedWebSocket,
  data: { name: string; password: string },
) => {
  const playerExists = players.some((player) => player.name === data.name);

  if (!playerExists) {
    const player: Player = {
      name: data.name,
      password: data.password,
      index: players.length + 1,
      wins: 0,
    };

    players.push(player);

    const returnMsg = JSON.stringify({
      type: 'reg',
      data: JSON.stringify({
        name: player.name,
        index: player.index,
        error: false,
        errorText: '',
      }),
      id: 0,
    });
    ws.send(returnMsg);

    ws.playerData = {
      name: player.name,
      index: player.index,
      wins: player.wins,
    };

    wsClients.set(ws, player);

    const availableRooms = rooms
      .filter((room) => room.players.length === 1)
      .map((room) => ({
        roomId: room.roomId,
        roomUsers: room.players.map((player) => ({
          name: player.name,
          index: player.index,
        })),
      }));

    ws.send(
      JSON.stringify({
        type: 'update_room',
        data: JSON.stringify(availableRooms),
        id: 0,
      }),
    );
  } else {
    const errorMessage = JSON.stringify({
      type: 'reg',
      data: JSON.stringify({
        name: data.name,
        error: true,
        errorText: 'Player already exists',
      }),
      id: 0,
    });
    ws.send(errorMessage);
  }
};

export const handleRoomCreation = (ws: ExtendedWebSocket) => {
  if (!ws.playerData) return;
  const room: Room = {
    roomId: rooms.length + 1,
    players: [ws.playerData],
    ships: {},
    gameStarted: false,
    currentTurn: 0,
  };
  rooms.push(room);

  broadcastRoomUpdate();
};

export const handleClientDisconnection = (ws: ExtendedWebSocket) => {
  const playerData = ws['playerData'];
  if (playerData) {
    console.log(`Player ${playerData.name} disconnected.`);
    wsClients.delete(ws);
  }
};
