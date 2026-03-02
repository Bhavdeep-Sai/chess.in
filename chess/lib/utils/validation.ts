/**
 * Input Validation and Sanitization Utilities
 */

export const validateGameName = (name: string | null): string | null => {
  if (!name || typeof name !== 'string') return null;
  
  const sanitized = name.trim().substring(0, 100);
  const cleaned = sanitized.replace(/[<>{}[\]\\\/]/g, '');
  
  if (cleaned.length < 1 || cleaned.length > 100) {
    return null;
  }
  
  return cleaned;
};

export const validateChatMessage = (message: string | null): string | null => {
  if (!message || typeof message !== 'string') return null;
  
  const sanitized = message.trim().substring(0, 500);
  
  if (sanitized.length < 1 || sanitized.length > 500) {
    return null;
  }
  
  return sanitized;
};

export const validateRoomPassword = (password: string | null): boolean => {
  if (!password || typeof password !== 'string') return false;
  
  const trimmed = password.trim();
  return trimmed.length >= 4 && trimmed.length <= 50;
};

export const validateRoomId = (roomId: string): boolean => {
  if (!roomId || typeof roomId !== 'string') return false;
  
  // Room IDs should be 8 character hex strings (uppercase)
  return /^[A-F0-9]{8}$/.test(roomId);
};

export const validateTimeControl = (timeControl: any): boolean => {
  if (!timeControl || typeof timeControl !== 'object') return false;
  
  const { initialTime, increment } = timeControl;
  
  // Initial time: 30 seconds to 3 hours (in milliseconds)
  if (!Number.isInteger(initialTime) || initialTime < 30000 || initialTime > 10800000) {
    return false;
  }
  
  // Increment: 0 to 60 seconds (in milliseconds)
  if (!Number.isInteger(increment) || increment < 0 || increment > 60000) {
    return false;
  }
  
  return true;
};

export const validateChessMove = (from: any, to: any): boolean => {
  if (!from || !to || typeof from !== 'object' || typeof to !== 'object') {
    return false;
  }
  
  const { row: fromRow, col: fromCol } = from;
  const { row: toRow, col: toCol } = to;
  
  // Check if coordinates are valid numbers
  if (!Number.isInteger(fromRow) || !Number.isInteger(fromCol) || 
      !Number.isInteger(toRow) || !Number.isInteger(toCol)) {
    return false;
  }
  
  // Check if coordinates are within board bounds
  if (fromRow < 0 || fromRow > 7 || fromCol < 0 || fromCol > 7 ||
      toRow < 0 || toRow > 7 || toCol < 0 || toCol > 7) {
    return false;
  }
  
  return true;
};
