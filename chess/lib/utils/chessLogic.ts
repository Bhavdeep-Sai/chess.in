// Chess game logic utilities - TypeScript version

export const PIECES = {
  PAWN: 'pawn',
  ROOK: 'rook',
  KNIGHT: 'knight',
  BISHOP: 'bishop',
  QUEEN: 'queen',
  KING: 'king'
} as const;

export const COLORS = {
  WHITE: 'white',
  BLACK: 'black'
} as const;

export type PieceType = typeof PIECES[keyof typeof PIECES];
export type ColorType = typeof COLORS[keyof typeof COLORS];

export interface Piece {
  type: PieceType;
  color: ColorType;
}

export type Board = (Piece | null)[][] | string; // Support both 2D array and FEN string

export interface CastlingRights {
  white: { kingside: boolean; queenside: boolean };
  black: { kingside: boolean; queenside: boolean };
}

// Position type
export interface Position {
  row: number;
  col: number;
}

// Player type
export interface Player {
  userId?: string | null;
  username?: string | null;
  isGuest?: boolean;
  guestId?: string | null;
  socketId?: string | null;
  isReady?: boolean;
}

// Move type
export interface Move {
  from: Position;
  to: Position;
  piece?: any;
  captured?: any;
  notation?: string;
  moveTime?: number;
  timestamp?: Date;
}

// Result type
export interface GameResult {
  winner: 'white' | 'black' | 'draw' | null;
  reason: 'checkmate' | 'resignation' | 'timeout' | 'draw' | 'stalemate' | 'draw_agreed' | 'abandoned' | null;
}

// Time control type
export interface TimeControl {
  initialTime: number;
  increment: number;
  whiteTime: number;
  blackTime: number;
}

// Draw offer type
export interface DrawOffer {
  from: 'white' | 'black' | null;
  fromUsername?: string;
  timestamp?: Date | null;
}

// Captured pieces type
export interface CapturedPieces {
  white: any[];
  black: any[];
}

// Game state type
export interface GameState {
  _id?: string;
  roomId: string;
  name?: string | null;
  players?: {
    white?: Player;
    black?: Player;
  };
  board: Board;
  currentPlayer: 'white' | 'black';
  gameStatus: 'waiting' | 'active' | 'paused' | 'finished';
  castlingRights: CastlingRights;
  result?: GameResult;
  moves?: Move[];
  timeControl?: TimeControl;
  settings?: any;
  roomType?: 'public' | 'private';
  chat?: any[];
  drawOffer?: DrawOffer | null;
  createdBy?: string | null;
  startedAt?: Date;
  endedAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

// Move with types (for legal move calculation)
export interface MoveWithTypes {
  row: number;
  col: number;
  isCapture: boolean;
}

// Initialize the chess board with pieces in starting positions
export const initializeBoard = (): Board => {
  const board: Board = Array(8).fill(null).map(() => Array(8).fill(null));
  
  // Place pawns
  for (let i = 0; i < 8; i++) {
    board[1][i] = { type: PIECES.PAWN, color: COLORS.BLACK };
    board[6][i] = { type: PIECES.PAWN, color: COLORS.WHITE };
  }
  
  // Place other pieces
  const pieceOrder: PieceType[] = [
    PIECES.ROOK, PIECES.KNIGHT, PIECES.BISHOP, PIECES.QUEEN, 
    PIECES.KING, PIECES.BISHOP, PIECES.KNIGHT, PIECES.ROOK
  ];
  
  for (let i = 0; i < 8; i++) {
    board[0][i] = { type: pieceOrder[i], color: COLORS.BLACK };
    board[7][i] = { type: pieceOrder[i], color: COLORS.WHITE };
  }
  
  return board;
};

const isValidPosition = (row: number, col: number): boolean => {
  return row >= 0 && row < 8 && col >= 0 && col < 8;
};

// Get all possible moves for a piece
export const getPossibleMoves = (
  board: Board, 
  row: number, 
  col: number, 
  piece: Piece, 
  castlingRights: CastlingRights | null = null
): [number, number][] => {
  const { type, color } = piece;
  
  switch (type) {
    case PIECES.PAWN:
      return getPawnMoves(board, row, col, color);
    case PIECES.ROOK:
      return getRookMoves(board, row, col, color);
    case PIECES.KNIGHT:
      return getKnightMoves(board, row, col, color);
    case PIECES.BISHOP:
      return getBishopMoves(board, row, col, color);
    case PIECES.QUEEN:
      return getQueenMoves(board, row, col, color);
    case PIECES.KING:
      const moves = getKingMoves(board, row, col, color);
      if (castlingRights) {
        moves.push(...getCastlingMoves(board, row, col, color, castlingRights));
      }
      return moves;
    default:
      return [];
  }
};

const getPawnMoves = (board: Board, row: number, col: number, color: ColorType): [number, number][] => {
  const moves: [number, number][] = [];
  const direction = color === COLORS.WHITE ? -1 : 1;
  const startRow = color === COLORS.WHITE ? 6 : 1;
  
  // Move forward one square
  if (isValidPosition(row + direction, col) && !board[row + direction][col]) {
    moves.push([row + direction, col]);
    
    // Move forward two squares from starting position
    if (row === startRow && !board[row + 2 * direction][col]) {
      moves.push([row + 2 * direction, col]);
    }
  }
  
  // Capture diagonally
  [-1, 1].forEach(offset => {
    const newCol = col + offset;
    if (isValidPosition(row + direction, newCol)) {
      const targetPiece = board[row + direction][newCol];
      if (targetPiece && targetPiece.color !== color) {
        moves.push([row + direction, newCol]);
      }
    }
  });
  
  return moves;
};

const getRookMoves = (board: Board, row: number, col: number, color: ColorType): [number, number][] => {
  const moves: [number, number][] = [];
  const directions: [number, number][] = [[0, 1], [0, -1], [1, 0], [-1, 0]];
  
  directions.forEach(([dRow, dCol]) => {
    for (let i = 1; i < 8; i++) {
      const newRow = row + i * dRow;
      const newCol = col + i * dCol;
      
      if (!isValidPosition(newRow, newCol)) break;
      
      const targetPiece = board[newRow][newCol];
      if (!targetPiece) {
        moves.push([newRow, newCol]);
      } else {
        if (targetPiece.color !== color) {
          moves.push([newRow, newCol]);
        }
        break;
      }
    }
  });
  
  return moves;
};

const getKnightMoves = (board: Board, row: number, col: number, color: ColorType): [number, number][] => {
  const moves: [number, number][] = [];
  const knightMoves: [number, number][] = [
    [-2, -1], [-2, 1], [-1, -2], [-1, 2],
    [1, -2], [1, 2], [2, -1], [2, 1]
  ];
  
  knightMoves.forEach(([dRow, dCol]) => {
    const newRow = row + dRow;
    const newCol = col + dCol;
    
    if (isValidPosition(newRow, newCol)) {
      const targetPiece = board[newRow][newCol];
      if (!targetPiece || targetPiece.color !== color) {
        moves.push([newRow, newCol]);
      }
    }
  });
  
  return moves;
};

const getBishopMoves = (board: Board, row: number, col: number, color: ColorType): [number, number][] => {
  const moves: [number, number][] = [];
  const directions: [number, number][] = [[1, 1], [1, -1], [-1, 1], [-1, -1]];
  
  directions.forEach(([dRow, dCol]) => {
    for (let i = 1; i < 8; i++) {
      const newRow = row + i * dRow;
      const newCol = col + i * dCol;
      
      if (!isValidPosition(newRow, newCol)) break;
      
      const targetPiece = board[newRow][newCol];
      if (!targetPiece) {
        moves.push([newRow, newCol]);
      } else {
        if (targetPiece.color !== color) {
          moves.push([newRow, newCol]);
        }
        break;
      }
    }
  });
  
  return moves;
};

const getQueenMoves = (board: Board, row: number, col: number, color: ColorType): [number, number][] => {
  return [
    ...getRookMoves(board, row, col, color),
    ...getBishopMoves(board, row, col, color)
  ];
};

const getKingMoves = (board: Board, row: number, col: number, color: ColorType): [number, number][] => {
  const moves: [number, number][] = [];
  const directions: [number, number][] = [
    [-1, -1], [-1, 0], [-1, 1],
    [0, -1],           [0, 1],
    [1, -1],  [1, 0],  [1, 1]
  ];
  
  directions.forEach(([dRow, dCol]) => {
    const newRow = row + dRow;
    const newCol = col + dCol;
    
    if (isValidPosition(newRow, newCol)) {
      const targetPiece = board[newRow][newCol];
      if (!targetPiece || targetPiece.color !== color) {
        moves.push([newRow, newCol]);
      }
    }
  });
  
  return moves;
};

const getCastlingMoves = (
  board: Board, 
  row: number, 
  col: number, 
  color: ColorType, 
  castlingRights: CastlingRights
): [number, number][] => {
  const moves: [number, number][] = [];
  const kingRow = color === COLORS.WHITE ? 7 : 0;
  
  if (row !== kingRow || col !== 4) return moves;
  
  // Kingside castling
  if (castlingRights[color].kingside) {
    if (!board[kingRow][5] && !board[kingRow][6] && board[kingRow][7]?.type === PIECES.ROOK) {
      moves.push([kingRow, 6]);
    }
  }
  
  // Queenside castling
  if (castlingRights[color].queenside) {
    if (!board[kingRow][3] && !board[kingRow][2] && !board[kingRow][1] && board[kingRow][0]?.type === PIECES.ROOK) {
      moves.push([kingRow, 2]);
    }
  }
  
  return moves;
};

// Check if a move is valid
export const isValidMove = (
  board: Board,
  from: { row: number; col: number },
  to: { row: number; col: number },
  piece: Piece,
  castlingRights: CastlingRights | null = null
): boolean => {
  const possibleMoves = getPossibleMoves(board, from.row, from.col, piece, castlingRights);
  return possibleMoves.some(([row, col]) => row === to.row && col === to.col);
};

// Make a move on the board
export const makeMove = (
  board: Board,
  from: { row: number; col: number },
  to: { row: number; col: number }
): { newBoard: Board; captured: Piece | null; isCastling: boolean; isEnPassant: boolean } => {
  const newBoard = board.map(row => [...row]);
  const piece = newBoard[from.row][from.col];
  const captured = newBoard[to.row][to.col];
  
  newBoard[to.row][to.col] = piece;
  newBoard[from.row][from.col] = null;
  
  // Handle castling
  const isCastling = piece?.type === PIECES.KING && Math.abs(to.col - from.col) === 2;
  if (isCastling) {
    if (to.col === 6) {
      newBoard[to.row][5] = newBoard[to.row][7];
      newBoard[to.row][7] = null;
    } else if (to.col === 2) {
      newBoard[to.row][3] = newBoard[to.row][0];
      newBoard[to.row][0] = null;
    }
  }
  
  return { newBoard, captured, isCastling, isEnPassant: false };
};

// Check if pawn promotion is required
export const requiresPromotion = (piece: Piece | null, toRow: number): boolean => {
  if (!piece || piece.type !== PIECES.PAWN) return false;
  return (piece.color === COLORS.WHITE && toRow === 0) || (piece.color === COLORS.BLACK && toRow === 7);
};

// Find king position
const findKingPosition = (board: Board, color: ColorType): [number, number] | null => {
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const piece = board[row][col];
      if (piece?.type === PIECES.KING && piece.color === color) {
        return [row, col];
      }
    }
  }
  return null;
};

// Check if a position is under attack
const isSquareUnderAttack = (board: Board, row: number, col: number, byColor: ColorType): boolean => {
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const piece = board[r][c];
      if (piece && piece.color === byColor) {
        const moves = getPossibleMoves(board, r, c, piece);
        if (moves.some(([moveRow, moveCol]) => moveRow === row && moveCol === col)) {
          return true;
        }
      }
    }
  }
  return false;
};

// Check if king is in check
export const isInCheck = (board: Board, color: ColorType): boolean => {
  const kingPos = findKingPosition(board, color);
  if (!kingPos) return false;
  
  const opponentColor = color === COLORS.WHITE ? COLORS.BLACK : COLORS.WHITE;
  return isSquareUnderAttack(board, kingPos[0], kingPos[1], opponentColor);
};

// Check if it's checkmate
export const isCheckmate = (board: Board, color: ColorType, castlingRights: CastlingRights): boolean => {
  if (!isInCheck(board, color)) return false;
  
  // Try all possible moves
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const piece = board[row][col];
      if (piece && piece.color === color) {
        const moves = getPossibleMoves(board, row, col, piece, castlingRights);
        for (const [toRow, toCol] of moves) {
          const { newBoard } = makeMove(board, { row, col }, { row: toRow, col: toCol });
          if (!isInCheck(newBoard, color)) {
            return false;
          }
        }
      }
    }
  }
  
  return true;
};

// Check if it's stalemate
export const isStalemate = (board: Board, color: ColorType, castlingRights: CastlingRights): boolean => {
  if (isInCheck(board, color)) return false;
  
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const piece = board[row][col];
      if (piece && piece.color === color) {
        const moves = getPossibleMoves(board, row, col, piece, castlingRights);
        for (const [toRow, toCol] of moves) {
          const { newBoard } = makeMove(board, { row, col }, { row: toRow, col: toCol });
          if (!isInCheck(newBoard, color)) {
            return false;
          }
        }
      }
    }
  }
  
  return true;
};

// Check if move is castling
export const isCastlingMove = (piece: Piece, from: { row: number; col: number }, to: { row: number; col: number }): boolean => {
  return piece.type === PIECES.KING && Math.abs(to.col - from.col) === 2;
};

// Get legal moves that don't leave the king in check
export const getLegalMoves = (
  board: Board,
  row: number,
  col: number,
  piece: Piece,
  castlingRights: CastlingRights | null = null
): [number, number][] => {
  const possibleMoves = getPossibleMoves(board, row, col, piece, castlingRights);
  const legalMoves: [number, number][] = [];
  
  for (const [toRow, toCol] of possibleMoves) {
    // Simulate the move
    const { newBoard } = makeMove(board, { row, col }, { row: toRow, col: toCol });
    
    // Check if the king is still in check after this move
    if (!isInCheck(newBoard, piece.color)) {
      legalMoves.push([toRow, toCol]);
    }
  }
  
  return legalMoves;
};
