'use client';

import { useState, useEffect, useCallback } from 'react';
import { initializeBoard, Board } from '../utils/chess';

export const useChessGame = () => {
  const [board, setBoard] = useState<Board>(initializeBoard());
  const [currentPlayer, setCurrentPlayer] = useState<'white' | 'black'>('white');
  const [selectedSquare, setSelectedSquare] = useState<{ row: number; col: number } | null>(null);

  const resetGame = useCallback(() => {
    setBoard(initializeBoard());
    setCurrentPlayer('white');
    setSelectedSquare(null);
  }, []);

  return {
    board,
    currentPlayer,
    selectedSquare,
    setBoard,
    setCurrentPlayer,
    setSelectedSquare,
    resetGame,
  };
};
