import { wsClients } from './database';
import { Room } from './types';

type MessageType = 'create' | 'start' | 'attack' | 'turn' | 'finish';

export const sendMessageToRoomPlayers = (
  room: Room,
  type: MessageType,
  data?: {
    x: number;
    y: number;
    indexPlayer: number;
    result: 'miss' | 'shot' | 'killed';
  },
) => {
  let message = '';

  for (const [client, player] of wsClients) {
    if (room.players.some((p) => p.index === player.index)) {
      switch (type) {
        case 'create':
          message = JSON.stringify({
            type: 'create_game',
            data: JSON.stringify({
              idGame: room.roomId,
              idPlayer: player.index,
            }),
            id: 0,
          });
          break;
        case 'start':
          message = JSON.stringify({
            type: 'start_game',
            data: JSON.stringify({
              ships: room.ships[player.index],
              currentPlayerIndex: room.players[0].index,
            }),
            id: 0,
          });
          break;
        case 'turn':
          message = JSON.stringify({
            type: 'turn',
            data: JSON.stringify({ currentPlayer: room.currentTurn }),
            id: 0,
          });
          break;
        case 'finish':
          if (!data) return;
          message = JSON.stringify({
            type: 'finish',
            data: JSON.stringify({ winPlayer: data.indexPlayer }),
            id: 0,
          });
          break;
        case 'attack':
          if (!data) return;
          message = JSON.stringify({
            type: 'attack',
            data: JSON.stringify({
              position: { x: data.x, y: data.y },
              currentPlayer: data.indexPlayer,
              status: data.result,
            }),
            id: 0,
          });
          break;
        default:
          break;
      }

      client.send(message);
    }
  }
};
