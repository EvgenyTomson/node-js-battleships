import { WebSocket } from 'ws';
import { rooms } from '../utils/database';
import { Ship, Room } from '../utils/types';
import { sendMessageToRoomPlayers } from '../utils/utils';

export const handleAddShips = (
  ws: WebSocket,
  data: { gameId: number; ships: Ship[]; indexPlayer: number },
) => {
  const room = rooms.find((r) => r.roomId === data.gameId);

  if (room) {
    room.ships[data.indexPlayer] = data.ships.map((ship) => ({
      ...ship,
      hits: [],
    }));

    if (Object.keys(room.ships).length === 2) {
      room.gameStarted = true;

      sendMessageToRoomPlayers(room, 'start');
    }
  } else {
    ws.send(JSON.stringify({ error: 'Room is not found' }));
  }
};

export const handleAttack = (
  ws: WebSocket,
  data: { gameId: number; x: number; y: number; indexPlayer: number },
) => {
  const room = rooms.find((r) => r.roomId === data.gameId);

  if (room && room.gameStarted) {
    if (room.currentTurn !== data.indexPlayer) {
      ws.send(JSON.stringify({ error: `It's not your turn now` }));
      return;
    }

    const result = checkAttack(room, data.x, data.y, data.indexPlayer);

    const { gameId, ...dataToSend } = data;

    sendMessageToRoomPlayers(room, 'attack', { ...dataToSend, result });

    if (result === 'shot' || result === 'killed') {
      const opponentPlayer = findOpponentPlayer(room, data.indexPlayer);
      if (
        opponentPlayer !== null &&
        allShipsKilled(room.ships[opponentPlayer])
      ) {
        ws.send(
          JSON.stringify({
            type: 'finish',
            data: JSON.stringify({ winPlayer: data.indexPlayer }),
            id: 0,
          }),
        );
        return;
      }
      return;
    }

    const opponentPlayer = findOpponentPlayer(room, data.indexPlayer);
    if (opponentPlayer) {
      room.currentTurn = opponentPlayer;

      sendMessageToRoomPlayers(room, 'turn');
    } else {
      ws.send(JSON.stringify({ error: 'Enemy not found' }));
    }
  } else {
    ws.send(
      JSON.stringify({ error: 'Room not found or game has not started yet' }),
    );
  }
};

const allShipsKilled = (ships: Ship[]): boolean => {
  return ships.every((ship) => ship.hits.length === ship.length);
};

const findOpponentPlayer = (room: Room, currentPlayer: number) => {
  const opponent = room.players.find(
    (player) => player.index !== currentPlayer,
  );
  return opponent ? opponent.index : null;
};

const checkAttack = (
  room: Room,
  x: number,
  y: number,
  attackingPlayer: number,
): 'miss' | 'shot' | 'killed' => {
  const opponentPlayer = findOpponentPlayer(room, attackingPlayer);

  console.log('checkAttack opponentPlayer: ', opponentPlayer);

  if (opponentPlayer) {
    const opponentShips = room.ships[Number(opponentPlayer)];

    // console.log('checkAttack opponentShips: ', opponentShips);

    for (const ship of opponentShips) {
      if (
        // true - vertical
        x >= ship.position.x &&
        x < ship.position.x + (ship.direction ? 1 : ship.length) &&
        y >= ship.position.y &&
        y < ship.position.y + (ship.direction ? ship.length : 1)
      ) {
        const isAlreadyHit = ship.hits.some(
          (hit) => hit.x === x && hit.y === y,
        );
        if (isAlreadyHit) {
          return 'miss';
        }

        ship.hits.push({ x, y });

        const isShipKilled = checkIfShipKilled(ship);

        return isShipKilled ? 'killed' : 'shot';
      }
    }
  }

  return 'miss';
};

const checkIfShipKilled = (ship: Ship) => ship.hits.length === ship.length;
