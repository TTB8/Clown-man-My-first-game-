export enum Tile {
  PATH,
  WALL,
  PELLET,
  POWER_PELLET,
  GHOST_HOUSE,
  EMPTY
}

export enum Direction {
  UP,
  DOWN,
  LEFT,
  RIGHT,
  NONE
}

export type Position = {
  x: number;
  y: number;
};

export interface PacmanState {
  position: Position;
  direction: Direction;
  nextDirection: Direction;
  isAnimating: boolean;
}

export enum GhostMode {
  CHASE,
  FRIGHTENED,
  EATEN
}

export interface GhostState {
  id: string;
  name: string;
  position: Position;
  startPosition: Position;
  direction: Direction;
  color: string;
  mode: GhostMode;
}

export enum GameStatus {
  READY,
  PLAYING,
  GAME_OVER,
  WON
}

export type Difficulty = 'Easy' | 'Normal' | 'Hard';
