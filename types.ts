export enum GameState {
  MENU = 'MENU',
  PACMAN = 'PACMAN',
  MARIO = 'MARIO'
}

export interface Position {
  x: number;
  y: number;
}

export interface Entity extends Position {
  width: number;
  height: number;
  vx: number;
  vy: number;
  color?: string;
  type?: 'player' | 'enemy' | 'platform' | 'coin' | 'exit';
}

export interface GameScore {
  current: number;
  high: number;
}