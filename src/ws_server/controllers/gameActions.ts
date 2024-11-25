import { WebSocket } from 'ws';
import { rooms, winners, wsClients } from '../utils/database';
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
        sendMessageToRoomPlayers(room, 'finish', { ...dataToSend, result });

        const currentWinnerName = room.players.find(
          (p) => p.index === data.indexPlayer,
        )?.name;
        if (currentWinnerName) {
          const winnerIndex = winners.findIndex(
            (w) => w.name === currentWinnerName,
          );
          if (winnerIndex !== -1) {
            const newWinsCount = winners[winnerIndex].wins + 1;
            winners.splice(winnerIndex, 1, {
              name: currentWinnerName,
              wins: newWinsCount,
            });
          } else {
            winners.push({ name: currentWinnerName, wins: 1 });
          }

          broadcastUpdateWinners();
        }

        const currentRoomIndex = rooms.findIndex(
          (r) => r.roomId === data.gameId,
        );
        if (currentRoomIndex !== -1) {
          rooms.splice(currentRoomIndex, 1);
        }

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

const checkShipHit = (hit: { x: number; y: number }, ship: Ship) => {
  return (
    hit.x >= ship.position.x &&
    hit.x < ship.position.x + (ship.direction ? 1 : ship.length) &&
    hit.y >= ship.position.y &&
    hit.y < ship.position.y + (ship.direction ? ship.length : 1)
  );
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

  if (opponentPlayer) {
    const opponentShips = room.ships[Number(opponentPlayer)];

    for (const ship of opponentShips) {
      if (checkShipHit({ x, y }, ship)) {
        const isAlreadyHit = ship.hits.some(
          (hit) => hit.x === x && hit.y === y,
        );
        if (isAlreadyHit) {
          return 'miss';
        }

        ship.hits.push({ x, y });

        const isShipKilled = checkIfShipKilled(ship);
        if (isShipKilled) {
          const neighborsCells = getNeighborsCells(ship);

          for (const { x, y } of neighborsCells) {
            const result: 'miss' | 'shot' | 'killed' = 'miss';
            const data = { x, y, indexPlayer: attackingPlayer, result };
            sendMessageToRoomPlayers(room, 'attack', data);
          }
        }

        return isShipKilled ? 'killed' : 'shot';
      }
    }
  }

  return 'miss';
};

const checkIfShipKilled = (ship: Ship) => ship.hits.length === ship.length;

const getNeighborsCells = (ship: Ship) => {
  const fromX = Math.max(ship.position.x - 1, 0);
  const toX = ship.direction
    ? Math.min(ship.position.x + 1, 9)
    : Math.min(ship.position.x + ship.length, 9);
  const fromY = Math.max(ship.position.y - 1, 0);
  const toY = ship.direction
    ? Math.min(ship.position.y + ship.length, 9)
    : Math.min(ship.position.y + 1, 9);

  const neighbors: { x: number; y: number }[] = [];

  for (let x = fromX; x <= toX; x++) {
    for (let y = fromY; y <= toY; y++) {
      const cell = { x, y };
      if (!ship.hits.some((hit) => hit.x === x && hit.y === y)) {
        neighbors.push(cell);
      }
    }
  }

  return neighbors;
};

const broadcastUpdateWinners = () => {
  for (const [client] of wsClients) {
    client.send(
      JSON.stringify({
        type: 'update_winners',
        data: winners.map((w) => JSON.stringify(w)),
        id: 0,
      }),
    );
  }
};
