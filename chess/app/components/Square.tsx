'use client';

import React from 'react';
import { getPieceSymbol } from '../utils/chess';

interface Piece {
  type: string;
  color: 'white' | 'black';
}

interface SquareProps {
  piece: Piece | null;
  isLight: boolean;
  isSelected: boolean;
  isValidMove: boolean;
  isCapture: boolean;
  isIllegalMove?: boolean;
  isIllegalCapture?: boolean;
  isInCheck?: boolean;
  onClick: (row: number, col: number) => void;
  row: number;
  col: number;
  isLastMove?: boolean;
  isCheck?: boolean;
  isInvalidMove?: boolean;
  disabled?: boolean;
}

const Square: React.FC<SquareProps> = ({ 
  piece, 
  isLight, 
  isSelected, 
  isValidMove, 
  isCapture,
  isIllegalMove = false,
  isIllegalCapture = false,
  isInCheck = false,
  onClick, 
  row, 
  col,
  isLastMove = false,
  isCheck = false,
  isInvalidMove = false,
  disabled = false
}) => {
  
  const getSquareClasses = () => {
    let classes = 'chess-square aspect-square flex items-center justify-center cursor-pointer relative ';
    
    // Base colors using CSS custom properties
    if (isLight) {
      classes += 'bg-chess-light ';
    } else {
      classes += 'bg-chess-dark ';
    }
    
    // State classes
    if (isSelected) {
      classes += 'selected ';
    }
    
    if (isValidMove && !piece) {
      classes += 'possible-move ';
    }
    
    if (isCapture || (isValidMove && piece)) {
      classes += 'capture-move ';
    }
    
    if (isIllegalMove) {
      classes += 'illegal-move ';
    }
    
    if (isIllegalCapture) {
      classes += 'illegal-capture ';
    }
    
    if (isInCheck || isCheck) {
      classes += 'in-check ';
    }

    if (isLastMove) {
      classes += 'last-move ';
    }

    if (isInvalidMove) {
      classes += 'invalid-move ';
    }

    if (disabled) {
      classes += 'cursor-default ';
    }
    
    return classes;
  };

  const getSquareStyle = (): React.CSSProperties => {
    return {
      backgroundColor: isLight ? '#EEEED2' : '#769656',
      width: '80px',
      height: '80px',
    };
  };

  return (
    <div 
      className={getSquareClasses()}
      style={getSquareStyle()}
      onClick={() => !disabled && onClick(row, col)}
    >
      {/* Chess Piece */}
      {piece && (
        <span 
          className="chess-piece select-none"
          style={{
            fontSize: '60px',
            color: piece.color === 'white' ? '#FFFFFF' : '#000000',
            textShadow: piece.color === 'white' 
              ? '1px 1px 1px rgba(0,0,0,0.9), 1px 1px 1px rgba(0,0,0,0.7), 1px 1px 3px rgba(0,0,0,0.8)' 
              : 'none',
            filter: piece.color === 'black' ? 'brightness(0)' : 'none',
          }}
        >
          {getPieceSymbol(piece)}
        </span>
      )}
      
      {/* Move indicators are handled by CSS pseudo-elements */}
    </div>
  );
};

export default Square;
