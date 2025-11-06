
import { Tile, Direction, GhostMode, type GhostState, type Position } from './types';

export const TILE_SIZE = 24; // pixels
export const GAME_SPEED = 180; // ms per tick
export const FRIGHTENED_DURATION = 40; // in ticks

export const MAZE_LAYOUT: Tile[][] = [
  [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
  [1, 2, 2, 2, 2, 2, 2, 2, 2, 1, 2, 2, 2, 2, 2, 2, 2, 3, 1],
  [1, 2, 1, 1, 2, 1, 1, 1, 2, 1, 2, 1, 1, 1, 2, 1, 1, 2, 1],
  [1, 3, 1, 1, 2, 1, 1, 1, 2, 1, 2, 1, 1, 1, 2, 1, 1, 2, 1],
  [1, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 1],
  [1, 2, 1, 1, 2, 1, 2, 1, 1, 1, 1, 1, 2, 1, 2, 1, 1, 2, 1],
  [1, 2, 2, 2, 2, 1, 2, 2, 2, 1, 2, 2, 2, 1, 2, 2, 2, 2, 1],
  [1, 1, 1, 1, 2, 1, 1, 1, 5, 1, 5, 1, 1, 1, 2, 1, 1, 1, 1],
  [5, 5, 5, 1, 2, 1, 5, 5, 5, 4, 5, 5, 5, 1, 2, 1, 5, 5, 5],
  [1, 1, 1, 1, 2, 1, 5, 1, 1, 4, 1, 1, 5, 1, 2, 1, 1, 1, 1],
  [2, 2, 2, 2, 2, 5, 5, 1, 4, 4, 4, 1, 5, 5, 2, 2, 2, 2, 2],
  [1, 1, 1, 1, 2, 1, 5, 1, 1, 1, 1, 1, 5, 1, 2, 1, 1, 1, 1],
  [5, 5, 5, 1, 2, 1, 5, 5, 5, 5, 5, 5, 5, 1, 2, 1, 5, 5, 5],
  [1, 1, 1, 1, 2, 1, 5, 1, 1, 1, 1, 1, 5, 1, 2, 1, 1, 1, 1],
  [1, 2, 2, 2, 2, 2, 2, 2, 2, 1, 2, 2, 2, 2, 2, 2, 2, 2, 1],
  [1, 2, 1, 1, 2, 1, 1, 1, 2, 1, 2, 1, 1, 1, 2, 1, 1, 2, 1],
  [1, 3, 2, 1, 2, 2, 2, 2, 2, 5, 2, 2, 2, 2, 2, 1, 2, 3, 1],
  [1, 1, 2, 1, 2, 1, 2, 1, 1, 1, 1, 1, 2, 1, 2, 1, 2, 1, 1],
  [1, 2, 2, 2, 2, 1, 2, 2, 2, 1, 2, 2, 2, 1, 2, 2, 2, 2, 1],
  [1, 2, 1, 1, 1, 1, 1, 1, 2, 1, 2, 1, 1, 1, 1, 1, 1, 2, 1],
  [1, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 1],
  [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
];

export const MAZE_WIDTH = MAZE_LAYOUT[0].length;
export const MAZE_HEIGHT = MAZE_LAYOUT.length;

export const PACMAN_START_POS: Position = { x: 9, y: 16 };

export const INITIAL_GHOSTS: GhostState[] = [
  {
    id: 'blinky',
    name: 'Blinky',
    position: { x: 9, y: 10 },
    startPosition: { x: 9, y: 10 },
    direction: Direction.LEFT,
    color: 'bg-red-500',
    mode: GhostMode.CHASE,
  },
  {
    id: 'pinky',
    name: 'Pinky',
    position: { x: 8, y: 10 },
    startPosition: { x: 8, y: 10 },
    direction: Direction.UP,
    color: 'bg-pink-500',
    mode: GhostMode.CHASE,
  },
  {
    id: 'inky',
    name: 'Inky',
    position: { x: 10, y: 10 },
    startPosition: { x: 10, y: 10 },
    direction: Direction.DOWN,
    color: 'bg-cyan-500',
    mode: GhostMode.CHASE,
  },
  {
    id: 'clyde',
    name: 'Clyde',
    position: { x: 9, y: 9 },
    startPosition: { x: 9, y: 9 },
    direction: Direction.RIGHT,
    color: 'bg-orange-500',
    mode: GhostMode.CHASE,
  },
];
