import jwt from 'jsonwebtoken';
import crypto from 'crypto';

// Generate JWT token
export const generateToken = (userId: string): string => {
  return jwt.sign(
    { userId },
    process.env.JWT_SECRET!,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
};

// Generate guest ID
export const generateGuestId = (): string => {
  return 'guest_' + crypto.randomBytes(8).toString('hex');
};

// Generate room ID
export const generateRoomId = (): string => {
  return crypto.randomBytes(4).toString('hex').toUpperCase();
};

// Validate email format
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Validate username format
export const isValidUsername = (username: string): boolean => {
  const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;
  return usernameRegex.test(username);
};

// Calculate new rating using basic ELO system
export const calculateNewRating = (
  playerRating: number, 
  opponentRating: number, 
  result: 'win' | 'loss' | 'draw'
): number => {
  const K = 32; // K-factor
  const expectedScore = 1 / (1 + Math.pow(10, (opponentRating - playerRating) / 400));
  
  let actualScore: number;
  switch (result) {
    case 'win':
      actualScore = 1;
      break;
    case 'loss':
      actualScore = 0;
      break;
    case 'draw':
      actualScore = 0.5;
      break;
    default:
      actualScore = 0.5;
  }
  
  const newRating = Math.round(playerRating + K * (actualScore - expectedScore));
  return Math.max(100, newRating); // Minimum rating of 100
};

// Format time for display
export const formatTime = (milliseconds: number): string => {
  const totalSeconds = Math.floor(milliseconds / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
};

// Chess notation utilities
export const algebraicNotation = (
  from: { row: number; col: number },
  to: { row: number; col: number },
  piece: { type: string; color: string },
  captured: any,
  isCheck: boolean,
  isCheckmate: boolean,
  promotion: string | null = null
): string => {
  const files = 'abcdefgh';
  const fromSquare = files[from.col] + (8 - from.row);
  const toSquare = files[to.col] + (8 - to.row);
  
  // Check for castling moves
  if (piece.type === 'king' && Math.abs(to.col - from.col) === 2) {
    let notation = '';
    
    // Kingside castling (king moves to g-file)
    if (to.col === 6) {
      notation = 'O-O';
    }
    // Queenside castling (king moves to c-file)  
    else if (to.col === 2) {
      notation = 'O-O-O';
    }
    
    // Add check/checkmate indicator for castling
    if (isCheckmate) {
      notation += '#';
    } else if (isCheck) {
      notation += '+';
    }
    
    return notation;
  }
  
  let notation = '';
  
  // Piece symbol (empty for pawn)
  if (piece.type !== 'pawn') {
    notation += piece.type.charAt(0).toUpperCase();
  }
  
  // Capture indicator
  if (captured) {
    if (piece.type === 'pawn') {
      notation += fromSquare[0]; // file of departure for pawn captures
    }
    notation += 'x';
  }
  
  // Destination square
  notation += toSquare;
  
  // Promotion
  if (promotion) {
    notation += '=' + promotion.charAt(0).toUpperCase();
  }
  
  // Check/checkmate indicator
  if (isCheckmate) {
    notation += '#';
  } else if (isCheck) {
    notation += '+';
  }
  
  return notation;
};
