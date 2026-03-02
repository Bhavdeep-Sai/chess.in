'use client';

import React, { useState, useEffect } from 'react';
import { Chess } from 'chess.js';
import dynamic from 'next/dynamic';

// Dynamically import Chessboard to avoid SSR issues
const Chessboard = dynamic(() => import('react-chessboard').then(mod => mod.Chessboard), {
  ssr: false,
  loading: () => <div className="w-full aspect-square bg-gray-200 rounded-lg animate-pulse" />
});

interface ReactChessboardWrapperProps {
  roomId: string;
  playerColor: 'white' | 'black' | null;
  gameState: any;
  isMyTurn: boolean;
  onMove?: (move: any) => void;
  onMoveAttempt: (from: string, to: string) => void;
}

const ReactChessboardWrapper: React.FC<ReactChessboardWrapperProps> = ({
  roomId,
  playerColor,
  gameState,
  isMyTurn,
  onMove,
  onMoveAttempt
}) => {
  const [game, setGame] = useState(new Chess());
  const [position, setPosition] = useState('start');
  const [moveFrom, setMoveFrom] = useState('');
  const [rightClickedSquares, setRightClickedSquares] = useState<{[key: string]: {backgroundColor: string}}>({});
  const [optionSquares, setOptionSquares] = useState({});

  console.log('🎨 ReactChessboardWrapper - playerColor:', playerColor, 'isMyTurn:', isMyTurn);

  // Initialize/update game from gameState
  useEffect(() => {
    console.log('🔄 Board sync check:', { 
      hasGameState: !!gameState, 
      hasBoardFEN: !!gameState?.board,
      fen: gameState?.board 
    });
    
    if (gameState?.board) {
      try {
        const newGame = new Chess(gameState.board);
        setGame(newGame);
        setPosition(gameState.board);
        console.log('✅ Board updated with FEN:', gameState.board);
        console.log('✅ Current turn:', newGame.turn() === 'w' ? 'white' : 'black');
      } catch (error) {
        console.error('❌ Error loading FEN:', error);
        // Fallback to starting position
        const newGame = new Chess();
        setGame(newGame);
        setPosition(newGame.fen());
      }
    } else {
      console.log('⚠️ No board FEN, using starting position');
      // No board state, use starting position
      const newGame = new Chess();
      setGame(newGame);
      setPosition(newGame.fen());
    }
  }, [gameState?.board]);

  function getMoveOptions(square: string) {
    const moves = game.moves({
      square,
      verbose: true
    });

    if (moves.length === 0) {
      setOptionSquares({});
      return false;
    }

    const newSquares: any = {};
    moves.forEach((move: any) => {
      newSquares[move.to] = {
        background:
          game.get(move.to) && game.get(move.to).color !== game.get(square).color
            ? 'radial-gradient(circle, rgba(0,0,0,.1) 85%, transparent 85%)'
            : 'radial-gradient(circle, rgba(0,0,0,.1) 25%, transparent 25%)',
        borderRadius: '50%'
      };
    });
    newSquares[square] = {
      background: 'rgba(255, 255, 0, 0.4)'
    };
    setOptionSquares(newSquares);
    return true;
  }

  function onSquareClick(square: string) {
    // Not player's turn
    if (!isMyTurn) {
      console.log('Not your turn');
      return;
    }

    // Reset if clicking same square
    if (square === moveFrom) {
      setMoveFrom('');
      setOptionSquares({});
      return;
    }

    // First click - select piece
    if (!moveFrom) {
      const piece = game.get(square);
      if (!piece) return;
      
      // Check if it's player's piece
      const isPlayerPiece = 
        (playerColor === 'white' && piece.color === 'w') ||
        (playerColor === 'black' && piece.color === 'b');
      
      if (!isPlayerPiece) {
        console.log('Not your piece');
        return;
      }
      
      const hasMoves = getMoveOptions(square);
      if (hasMoves) setMoveFrom(square);
      return;
    }

    // Second click - attempt move
    attemptMove(moveFrom, square);
  }

  function attemptMove(from: string, to: string) {
    const moves = game.moves({ square: from, verbose: true });
    const move = moves.find((m: any) => m.from === from && m.to === to);

    if (!move) {
      console.log('Invalid move', from, to);
      setMoveFrom('');
      setOptionSquares({});
      return false;
    }

    console.log('Attempting move:', from, to);
    // Send move to server
    onMoveAttempt(from, to);
    
    setMoveFrom('');
    setOptionSquares({});
    return true;
  }

  function onPieceDrop(sourceSquare: string, targetSquare: string): boolean {
    // Not player's turn
    if (!isMyTurn) {
      console.log('❌ Not your turn');
      return false;
    }

    // Check if piece belongs to player
    const sourcePiece = game.get(sourceSquare);
    if (!sourcePiece) {
      console.log('❌ No piece at source');
      return false;
    }
    
    const isPlayerPiece = 
      (playerColor === 'white' && sourcePiece.color === 'w') ||
      (playerColor === 'black' && sourcePiece.color === 'b');
    
    if (!isPlayerPiece) {
      console.log('❌ Not your piece');
      return false;
    }

    // Check if move is valid
    const moves = game.moves({ square: sourceSquare, verbose: true });
    const move = moves.find((m: any) => m.from === sourceSquare && m.to === targetSquare);

    if (!move) {
      console.log('❌ Invalid move:', sourceSquare, '->', targetSquare);
      return false;
    }

    console.log('✅ Valid move, sending to server:', sourceSquare, '->', targetSquare);
    // Send move to server
    onMoveAttempt(sourceSquare, targetSquare);
    return true;
  }

  function onSquareRightClick(square: string) {
    const colour = 'rgba(255, 0, 0, 0.4)';
    setRightClickedSquares({
      ...rightClickedSquares,
      [square]:
        rightClickedSquares[square] && rightClickedSquares[square].backgroundColor === colour
          ? {}
          : { backgroundColor: colour }
    });
  }

  return (
    <div className="w-full max-w-2xl mx-auto relative">
      <Chessboard
        id="multiplayer-board"
        animationDuration={200}
        boardOrientation={playerColor || 'white'}
        position={position}
        onPieceDrop={onPieceDrop}
        onSquareClick={onSquareClick}
        onSquareRightClick={onSquareRightClick}
        customBoardStyle={{
          borderRadius: '8px',
          boxShadow: '0 5px 15px rgba(0, 0, 0, 0.5)'
        }}
        customSquareStyles={{
          ...optionSquares,
          ...rightClickedSquares
        }}
        arePiecesDraggable={isMyTurn && !game.isGameOver()}
      />
      
      {/* Winner Overlay on Board */}
      {game.isCheckmate() && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm rounded-lg pointer-events-none">
          <div className="text-center px-8 py-6 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-2xl shadow-2xl transform scale-110">
            <div className="text-6xl mb-2">🏆</div>
            <h2 className="text-4xl font-bold text-white mb-2">
              {game.turn() === 'w' ? 
                (playerColor === 'black' ? 'You Win!' : `${gameState?.players?.black?.username || 'Black'} Wins!`) :
                (playerColor === 'white' ? 'You Win!' : `${gameState?.players?.white?.username || 'White'} Wins!`)
              }
            </h2>
            <p className="text-xl text-white/90">Checkmate!</p>
          </div>
        </div>
      )}
      
      {game.isDraw() && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm rounded-lg pointer-events-none">
          <div className="text-center px-8 py-6 bg-gradient-to-br from-blue-400 to-blue-600 rounded-2xl shadow-2xl transform scale-110">
            <div className="text-6xl mb-2">🤝</div>
            <h2 className="text-4xl font-bold text-white mb-2">Draw!</h2>
            <p className="text-xl text-white/90">Game Drawn</p>
          </div>
        </div>
      )}
      
      {/* Game Status Info */}
      <div className="mt-4 text-center space-y-2">
        {game.isCheck() && !game.isCheckmate() && (
          <div className="text-red-600 font-bold text-xl animate-pulse">
            ⚠️ Check!
          </div>
        )}
      </div>
    </div>
  );
};

export default ReactChessboardWrapper;
