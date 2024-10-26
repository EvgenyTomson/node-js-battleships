export interface Player {
  name: string;
  password: string;
  index: number;
  wins: number;
}

export interface Ship {
  position: {
    x: number;
    y: number;
  };
  direction: boolean; // true - vertical
  length: number;
  type: 'small' | 'medium' | 'large' | 'huge';
  hits: { x: number; y: number }[];
}

type RoomPlayer = Omit<Player, 'password'>;

export interface Room {
  roomId: number;
  players: RoomPlayer[];
  ships: { [playerIndex: number]: Ship[] };
  gameStarted: boolean;
  currentTurn: number;
}
