
import React, { useEffect, useReducer, useCallback } from 'react';
import { 
  MAZE_LAYOUT, TILE_SIZE, PACMAN_START_POS, 
  INITIAL_GHOSTS, GAME_SPEED, MAZE_WIDTH, MAZE_HEIGHT, FRIGHTENED_DURATION
} from './constants';
import { 
  Tile, Direction, GameStatus, GhostMode, 
  type Position, type PacmanState, type GhostState, type Difficulty 
} from './types';

// --- GAME STATE & ACTIONS ---

interface GameState {
  board: Tile[][];
  pacman: PacmanState;
  ghosts: GhostState[];
  score: number;
  lives: number;
  status: GameStatus;
  pelletCount: number;
  frightenedTimer: number;
  tick: number;
  difficulty: Difficulty;
}

type GameAction =
  | { type: 'START_GAME' }
  | { type: 'TICK' }
  | { type: 'KEY_PRESS'; payload: Direction }
  | { type: 'RESTART' }
  | { type: 'SET_DIFFICULTY', payload: Difficulty };

// --- UTILITY & AI FUNCTIONS ---

const getInitialState = (): GameState => {
  const pelletCount = MAZE_LAYOUT.flat().filter(tile => tile === Tile.PELLET || tile === Tile.POWER_PELLET).length;
  return {
    board: MAZE_LAYOUT.map(row => [...row]),
    pacman: {
      position: PACMAN_START_POS,
      direction: Direction.NONE,
      nextDirection: Direction.NONE,
      isAnimating: false,
    },
    ghosts: JSON.parse(JSON.stringify(INITIAL_GHOSTS)),
    score: 0,
    lives: 3,
    status: GameStatus.READY,
    pelletCount,
    frightenedTimer: 0,
    tick: 0,
    difficulty: 'Normal',
  };
};

const isWall = (board: Tile[][], pos: Position): boolean => {
    if (pos.x < 0 || pos.x >= MAZE_WIDTH || pos.y < 0 || pos.y >= MAZE_HEIGHT) return true;
    const tile = board[pos.y][pos.x];
    return tile === Tile.WALL;
};
const isGhostHouse = (board: Tile[][], pos: Position): boolean => {
    if (pos.x < 0 || pos.x >= MAZE_WIDTH || pos.y < 0 || pos.y >= MAZE_HEIGHT) return false;
    return board[pos.y][pos.x] === Tile.GHOST_HOUSE;
}

const getNextPosition = (pos: Position, dir: Direction): Position => {
  let { x, y } = pos;
  switch (dir) {
    case Direction.UP: y--; break;
    case Direction.DOWN: y++; break;
    case Direction.LEFT: x--; break;
    case Direction.RIGHT: x++; break;
  }
  // Tunnel logic
  if (x < 0) x = MAZE_WIDTH - 1;
  if (x >= MAZE_WIDTH) x = 0;
  return { x, y };
};

const getOppositeDirection = (dir: Direction): Direction => {
    if (dir === Direction.NONE) return Direction.NONE;
    const opposites = [Direction.DOWN, Direction.UP, Direction.RIGHT, Direction.LEFT];
    return opposites[dir];
};


// Greedy pathfinding for Normal/Easy mode
const getGreedyMove = (currentPos: Position, targetPos: Position, validMoves: Direction[]): Direction => {
    let bestMove = validMoves[0];
    let minDistance = Infinity;
    for (const move of validMoves) {
        const nextPos = getNextPosition(currentPos, move);
        const distance = Math.abs(nextPos.x - targetPos.x) + Math.abs(nextPos.y - targetPos.y);
        if(distance < minDistance) {
            minDistance = distance;
            bestMove = move;
        }
    }
    return bestMove;
};

// BFS pathfinding for Hard mode
const findShortestPathMove = (board: Tile[][], start: Position, end: Position): Direction | null => {
    const queue: [Position, Direction[]][] = [];
    const visited = new Set<string>([`${start.y},${start.x}`]);

    queue.push([start, []]);

    while (queue.length > 0) {
        const [currentPos, path] = queue.shift()!;

        if (currentPos.y === end.y && currentPos.x === end.x) {
            return path[0];
        }

        const neighbors = [Direction.UP, Direction.DOWN, Direction.LEFT, Direction.RIGHT];
        for (const dir of neighbors) {
            const nextPos = getNextPosition(currentPos, dir);
            const key = `${nextPos.y},${nextPos.x}`;
            // For BFS, we only care about walls. The ghost house logic is handled by the caller.
            if (
                !isWall(board, nextPos) && 
                !visited.has(key)
            ) {
                visited.add(key);
                const newPath = [...path, dir];
                queue.push([nextPos, newPath]);
            }
        }
    }
    return null; // No path found
};

// --- GAME REDUCER ---

const gameReducer = (state: GameState, action: GameAction): GameState => {
  switch (action.type) {
    case 'START_GAME':
      if (state.status === GameStatus.READY) {
        return { ...state, status: GameStatus.PLAYING };
      }
      return state;
    case 'RESTART':
        return getInitialState();
    case 'SET_DIFFICULTY':
      if (state.status !== GameStatus.PLAYING) {
        return { ...state, difficulty: action.payload };
      }
      return state;
    case 'KEY_PRESS': {
      if (state.status !== GameStatus.PLAYING) return state;
      return {
        ...state,
        pacman: { ...state.pacman, nextDirection: action.payload },
      };
    }
    case 'TICK': {
      if (state.status !== GameStatus.PLAYING) return state;
      let newState = { ...state, tick: state.tick + 1 };
      
      if (newState.frightenedTimer > 0) {
        newState.frightenedTimer--;
        if (newState.frightenedTimer === 0) {
          newState.ghosts = newState.ghosts.map(g => g.mode === GhostMode.FRIGHTENED ? {...g, mode: GhostMode.CHASE} : g);
        }
      }

      let pacman = { ...newState.pacman };
      let desiredNextPos = getNextPosition(pacman.position, pacman.nextDirection);
      if (!isWall(newState.board, desiredNextPos)) {
        pacman.direction = pacman.nextDirection;
      }
      let nextPos = getNextPosition(pacman.position, pacman.direction);
      if (!isWall(newState.board, nextPos)) {
        pacman.position = nextPos;
        pacman.isAnimating = !pacman.isAnimating;
      }
      
      const currentTile = newState.board[pacman.position.y][pacman.position.x];
      if (currentTile === Tile.PELLET) {
        newState.score += 10;
        newState.pelletCount--;
        newState.board[pacman.position.y][pacman.position.x] = Tile.EMPTY;
      } else if (currentTile === Tile.POWER_PELLET) {
        newState.score += 50;
        newState.pelletCount--;
        newState.board[pacman.position.y][pacman.position.x] = Tile.EMPTY;
        newState.frightenedTimer = FRIGHTENED_DURATION;
        newState.ghosts = newState.ghosts.map(g => ({...g, mode: GhostMode.FRIGHTENED}));
      }
      newState.pacman = pacman;

      newState.ghosts = newState.ghosts.map(ghost => {
        let newGhost = {...ghost};
        if(newGhost.mode === GhostMode.EATEN) {
          if (newGhost.position.x === newGhost.startPosition.x && newGhost.position.y === newGhost.startPosition.y) {
            newGhost.mode = GhostMode.CHASE;
          } else {
            const target = newGhost.startPosition;
            // Eaten ghosts can go through walls and the ghost house door
            const validMoves = [Direction.UP, Direction.DOWN, Direction.LEFT, Direction.RIGHT].filter(dir => !isWall(newState.board, getNextPosition(newGhost.position, dir)));
            if (validMoves.length > 0) {
              newGhost.direction = getGreedyMove(newGhost.position, target, validMoves);
              newGhost.position = getNextPosition(newGhost.position, newGhost.direction);
            }
          }
        } else { // Chase or Frightened
            if (newState.difficulty === 'Easy' && newState.tick % 2 !== 0 && newGhost.mode !== GhostMode.FRIGHTENED) {
                return newGhost; // Skip move on easy mode
            }
            
            const isCurrentlyInHouse = isGhostHouse(newState.board, newGhost.position);
            let possibleMoves = [Direction.UP, Direction.DOWN, Direction.LEFT, Direction.RIGHT].filter(dir => {
                const nextPos = getNextPosition(newGhost.position, dir);
                if (isWall(newState.board, nextPos)) return false;
                // Allow movement if ghost is inside the house OR the next tile is not the house.
                // This lets them out but not back in.
                return isCurrentlyInHouse || !isGhostHouse(newState.board, nextPos);
            });

            if (possibleMoves.length > 1 && newGhost.direction !== Direction.NONE) {
                const opposite = getOppositeDirection(newGhost.direction);
                possibleMoves = possibleMoves.filter(dir => dir !== opposite);
            }

            const validMoves = possibleMoves;

            if (validMoves.length > 0) {
                let bestMove: Direction;

                if (newGhost.mode === GhostMode.FRIGHTENED) {
                    bestMove = validMoves[Math.floor(Math.random() * validMoves.length)];
                } else { // Chase mode
                    const target = newState.pacman.position;
                    switch (newState.difficulty) {
                        case 'Easy':
                            if (Math.random() < 0.5) { // 50% chance for random move
                                bestMove = validMoves[Math.floor(Math.random() * validMoves.length)];
                            } else {
                                bestMove = getGreedyMove(newGhost.position, target, validMoves);
                            }
                            break;
                        case 'Hard':
                            const bfsMove = findShortestPathMove(newState.board, newGhost.position, target);
                            if (bfsMove !== null && validMoves.includes(bfsMove)) {
                                bestMove = bfsMove;
                            } else {
                                bestMove = getGreedyMove(newGhost.position, target, validMoves); // Fallback
                            }
                            break;
                        case 'Normal':
                        default:
                            bestMove = getGreedyMove(newGhost.position, target, validMoves);
                            break;
                    }
                }
                newGhost.direction = bestMove;
                newGhost.position = getNextPosition(newGhost.position, newGhost.direction);
            }
        }
        return newGhost;
      });
      
      for (let i = 0; i < newState.ghosts.length; i++) {
        const ghost = newState.ghosts[i];
        if (ghost.position.x === newState.pacman.position.x && ghost.position.y === newState.pacman.position.y) {
          if (ghost.mode === GhostMode.FRIGHTENED) {
            newState.score += 200;
            newState.ghosts[i] = {...ghost, mode: GhostMode.EATEN};
          } else if (ghost.mode === GhostMode.CHASE) {
            newState.lives--;
            if (newState.lives > 0) {
              newState.status = GameStatus.PLAYING; // To pause briefly, can change this
              newState.pacman = { ...getInitialState().pacman };
              newState.ghosts = getInitialState().ghosts;
            } else {
              newState.status = GameStatus.GAME_OVER;
            }
          }
        }
      }
      
      if (newState.pelletCount === 0) {
        newState.status = GameStatus.WON;
      }

      return newState;
    }
  }
  return state;
};


// --- UI COMPONENTS ---

const PacmanComponent: React.FC<{ pacman: PacmanState }> = ({ pacman }) => {
  const rotation = {
    [Direction.RIGHT]: 'rotate-0',
    [Direction.DOWN]: 'rotate-90',
    [Direction.LEFT]: 'rotate-180',
    [Direction.UP]: 'rotate-270',
    [Direction.NONE]: 'rotate-0',
  }[pacman.direction];
  const mouthClipPath = pacman.isAnimating ? 'polygon(0 0, 100% 0, 100% 40%, 50% 50%, 100% 60%, 100% 100%, 0 100%)' : 'polygon(0 0, 100% 0, 100% 100%, 0 100%)';
  
  return (
    <div className="absolute transition-transform duration-100 ease-linear" style={{ width: TILE_SIZE, height: TILE_SIZE, left: pacman.position.x * TILE_SIZE, top: pacman.position.y * TILE_SIZE, }}>
      <div className={`w-full h-full relative ${rotation}`}>
        
        {/* Clown Hair - Left Side (Cyan) */}
        <div className="absolute w-1/2 h-1/2" style={{top: '25%', left: '-20%', zIndex: -1}}>
            <div className="absolute w-2/3 h-2/3 bg-cyan-400 rounded-full" style={{top: '0', left: '0'}}/>
            <div className="absolute w-2/3 h-2/3 bg-cyan-400 rounded-full" style={{top: '33%', left: '33%'}}/>
            <div className="absolute w-2/3 h-2/3 bg-cyan-400 rounded-full" style={{top: '33%', left: '0'}}/>
        </div>

        {/* Clown Hair - Right Side (Pink) */}
        <div className="absolute w-1/2 h-1/2" style={{top: '25%', right: '-20%', zIndex: -1}}>
            <div className="absolute w-2/3 h-2/3 bg-pink-500 rounded-full" style={{top: '0', right: '0'}}/>
            <div className="absolute w-2/3 h-2/3 bg-pink-500 rounded-full" style={{top: '33%', right: '33%'}}/>
            <div className="absolute w-2/3 h-2/3 bg-pink-500 rounded-full" style={{top: '33%', right: '0'}}/>
        </div>

        {/* Face */}
        <div className={`w-full h-full bg-yellow-400 rounded-full`} style={{ clipPath: mouthClipPath }} />

        {/* Nose */}
        <div 
            className="absolute bg-red-600 rounded-full"
            style={{
                width: '25%',
                height: '25%',
                top: '50%',
                left: '65%',
                transform: 'translate(-50%, -50%)',
            }}
        />
      </div>
    </div>
  );
};

const GhostComponent: React.FC<{ ghost: GhostState, frightenedTimer: number }> = ({ ghost, frightenedTimer }) => {
  const isFrightened = ghost.mode === GhostMode.FRIGHTENED;
  const isEaten = ghost.mode === GhostMode.EATEN;
  const isBlinking = isFrightened && frightenedTimer > 0 && frightenedTimer < 15 && frightenedTimer % 2 === 0;

  const ghostColor = ghost.color.replace('bg-','').replace('-500','');

  return (
    <div className="absolute transition-all duration-100 ease-linear" style={{ width: TILE_SIZE, height: TILE_SIZE, left: ghost.position.x * TILE_SIZE, top: ghost.position.y * TILE_SIZE, zIndex: 10, }}>
      {isEaten ? (<div className="w-full h-full flex items-center justify-center"><svg viewBox="0 0 20 20" className="w-4/5 h-4/5 text-white opacity-75"><circle cx="6" cy="9" r="2" fill="currentColor" /><circle cx="14" cy="9" r="2" fill="currentColor" /></svg></div>) : (
      <svg viewBox="0 0 20 20" className={`w-full h-full`} style={{ color: isFrightened ? (isBlinking ? 'white' : '#2563eb') : ghostColor }}>
          <path fill="currentColor" d="M10 0 C4.47 0 0 4.47 0 10 L0 20 L5 17 L10 20 L15 17 L20 20 L20 10 C20 4.47 15.53 0 10 0 Z" />
           {isFrightened ? (<><path d="M 6 13 C 7 11, 8 11, 9 13 S 11 15, 12 13 S 13 11, 14 13" stroke="white" strokeWidth="1" fill="none" /></>) : (<>
          <circle cx="6" cy="9" r="2" fill="white" />
          <circle cx="14" cy="9" r="2" fill="white" />
          <circle cx="6" cy="9" r="1" fill="black" />
          <circle cx="14" cy="9" r="1" fill="black" />
          </>)}
      </svg>
      )}
    </div>
  );
};

// --- MAIN APP COMPONENT ---

export default function App() {
  const [state, dispatch] = useReducer(gameReducer, getInitialState());

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'r' || e.key === 'R') {
        dispatch({type: 'RESTART'});
        return;
    }
    if (state.status === GameStatus.READY) {
        dispatch({ type: 'START_GAME' });
        // Don't process movement keys until game starts, but allow start
    }
    
    let direction: Direction | null = null;
    switch (e.key) {
      case 'ArrowUp': case 'w': direction = Direction.UP; break;
      case 'ArrowDown': case 's': direction = Direction.DOWN; break;
      case 'ArrowLeft': case 'a': direction = Direction.LEFT; break;
      case 'ArrowRight': case 'd': direction = Direction.RIGHT; break;
    }

    if (direction !== null) {
      e.preventDefault();
      dispatch({ type: 'KEY_PRESS', payload: direction });
    }
  }, [state.status]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  useEffect(() => {
    if (state.status !== GameStatus.PLAYING) return;
    const gameInterval = setInterval(() => dispatch({ type: 'TICK' }), GAME_SPEED);
    return () => clearInterval(gameInterval);
  }, [state.status]);

  const { board, pacman, ghosts, score, lives, status, difficulty, frightenedTimer } = state;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 font-mono bg-black text-white">
      <div className="flex justify-between w-full max-w-lg mb-4 text-xl">
        <div>SCORE: {score}</div>
        <div className="flex items-center space-x-2">
            <span>LIVES:</span>
            {Array.from({ length: lives }).map((_, i) => (<div key={i} className="w-6 h-6 bg-yellow-400 rounded-full"/>))}
        </div>
      </div>
      
      <div className="relative bg-black border-2 border-blue-500 shadow-lg shadow-blue-500/50" style={{ width: MAZE_WIDTH * TILE_SIZE, height: MAZE_HEIGHT * TILE_SIZE }}>
        {status !== GameStatus.PLAYING && (
            <div className="absolute inset-0 bg-black bg-opacity-70 flex flex-col items-center justify-center z-20">
                <h2 className="text-5xl font-bold text-yellow-400 mb-4 animate-pulse">
                    {status === GameStatus.GAME_OVER && "GAME OVER"}
                    {status === GameStatus.WON && "YOU WON!"}
                    {status === GameStatus.READY && "READY?"}
                </h2>
                <p className="text-lg">
                    {status === GameStatus.READY ? "Press any key to Start" : "Press 'R' to Restart"}
                </p>
                {status === GameStatus.READY && (
                    <div className="mt-8">
                        <h3 className="text-xl text-center mb-3 text-cyan-300">DIFFICULTY</h3>
                        <div className="flex justify-center space-x-4">
                            {(['Easy', 'Normal', 'Hard'] as const).map(level => (
                                <div key={level}>
                                    <input 
                                        type="radio" 
                                        id={`diff-${level}`} 
                                        name="difficulty" 
                                        value={level} 
                                        checked={difficulty === level}
                                        onChange={() => dispatch({ type: 'SET_DIFFICULTY', payload: level })}
                                        className="sr-only peer"
                                    />
                                    <label 
                                        htmlFor={`diff-${level}`}
                                        className="px-4 py-2 border-2 border-blue-500 rounded-lg cursor-pointer peer-checked:bg-yellow-400 peer-checked:text-black peer-checked:border-yellow-400 font-bold transition-colors"
                                    >
                                        {level}
                                    </label>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        )}
        
        {board.map((row, y) => (
          row.map((tile, x) => {
            const key = `${x}-${y}`;
            if (tile === Tile.WALL) return <div key={key} className="absolute bg-blue-700" style={{ width: TILE_SIZE, height: TILE_SIZE, left: x * TILE_SIZE, top: y * TILE_SIZE }} />;
            if (tile === Tile.PELLET) return <div key={key} className="absolute flex items-center justify-center" style={{ width: TILE_SIZE, height: TILE_SIZE, left: x * TILE_SIZE, top: y * TILE_SIZE }}><div className="w-1.5 h-1.5 bg-yellow-200 rounded-full"/></div>;
            if (tile === Tile.POWER_PELLET) return <div key={key} className="absolute flex items-center justify-center" style={{ width: TILE_SIZE, height: TILE_SIZE, left: x * TILE_SIZE, top: y * TILE_SIZE }}><div className="w-3 h-3 bg-yellow-200 rounded-full animate-pulse"/></div>;
            return null;
          })
        ))}
        
        <PacmanComponent pacman={pacman} />
        {ghosts.map(ghost => <GhostComponent key={ghost.id} ghost={ghost} frightenedTimer={frightenedTimer} />)}
      </div>

      <div className="mt-4 text-sm text-gray-400">
        Use Arrow Keys or WASD to move. Press 'R' to restart.
      </div>
    </div>
  );
}
