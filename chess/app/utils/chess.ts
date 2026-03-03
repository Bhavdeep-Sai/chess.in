// Chess game logic utilities - Client version

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

export type Board = (Piece | null)[][];

export interface MoveWithType {
  row: number;
  col: number;
  type: 'normal' | 'capture' | 'castling';
  isCapture: boolean;
}

export interface CastlingRights {
  white: { kingside: boolean; queenside: boolean };
  black: { kingside: boolean; queenside: boolean };
}

// Initialize the chess board
export const initializeBoard = (): Board => {
  const board: Board = Array(8).fill(null).map(() => Array(8).fill(null));
  
  for (let i = 0; i < 8; i++) {
    board[1][i] = { type: PIECES.PAWN, color: COLORS.BLACK };
    board[6][i] = { type: PIECES.PAWN, color: COLORS.WHITE };
  }
  
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

// Get legal moves with types (normal, capture, castling) - Only moves that don't leave king in check
export const getLegalMovesWithTypes = (
  board: Board,
  row: number,
  col: number,
  piece: Piece,
  castlingRights?: CastlingRights
): MoveWithType[] => {
  // Import from chessLogic
  const { getLegalMoves } = require('@/lib/utils/chessLogic');
  
  // Get only legal moves (those that don't leave king in check)
  const legalMoves = getLegalMoves(board, row, col, piece, castlingRights);
  
  return legalMoves.map(([moveRow, moveCol]) => {
    const isCapture = board[moveRow][moveCol] !== null;
    return {
      row: moveRow,
      col: moveCol,
      type: isCapture ? 'capture' : 'normal',
      isCapture
    };
  });
};

// Get chess piece Unicode symbol
export const getPieceSymbol = (piece: Piece | null): string => {
  if (!piece) return '';
  
  const symbols: Record<PieceType, string> = {
    [PIECES.KING]: piece.color === COLORS.WHITE ? '♔' : '♚',
    [PIECES.QUEEN]: piece.color === COLORS.WHITE ? '♕' : '♛',
    [PIECES.ROOK]: piece.color === COLORS.WHITE ? '♖' : '♜',
    [PIECES.BISHOP]: piece.color === COLORS.WHITE ? '♗' : '♝',
    [PIECES.KNIGHT]: piece.color === COLORS.WHITE ? '♘' : '♞',
    [PIECES.PAWN]: piece.color === COLORS.WHITE ? '♙' : '♟',
  };
  
  return symbols[piece.type] || '';
};

// Check if requires promotion
export const requiresPromotion = (piece: Piece | null, toRow: number): boolean => {
  if (!piece || piece.type !== PIECES.PAWN) return false;
  return (piece.color === COLORS.WHITE && toRow === 0) || (piece.color === COLORS.BLACK && toRow === 7);
};
