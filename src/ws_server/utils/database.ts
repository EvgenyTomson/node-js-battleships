import { ExtendedWebSocket } from '../controllers/commandRouter';
import { Player, Room } from './types';

export const players: Player[] = [];

export const rooms: Room[] = [];

export const wsClients = new Map<ExtendedWebSocket, Player>();
