'use client';

import React from 'react';
import Square from './Square';
import GameInfo from './GameInfo';
import MoveIndicatorLegend from './MoveIndicatorLegend';
import CapturedPieces from './CapturedPieces';
import { useChessGame } from '../hooks/useChessGame';

interface ChessBoardProps {
  onLeaveGame?: () => void;
}

const ChessBoard: React.FC<ChessBoardProps> = ({ onLeaveGame }) => {
  const {
    board,
    selectedSquare,
    currentPlayer,
    gameStatus,
    capturedPieces,
    moveHistory,
    handleSquareClick,
    resetGame,
    undoLastMove,
    deselectSquare,
    isSquareSelected,
    isValidMoveSquare,
    isCaptureSquare,
    isKingInCheck,
    getGameStatusMessage
  } = useChessGame();

  return (
    <div className="flex flex-col lg:flex-row items-start justify-center gap-6 lg:gap-10 p-4 sm:p-6 lg:p-10 bg-gray-50 dark:bg-gray-900 min-h-screen transition-colors duration-200">
      {/* Game Header - Mobile */}
      <div className="lg:hidden w-full text-center mb-4">
        <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-2 flex items-center justify-center gap-3">
          <span className="text-2xl">♟️</span>
          Practice Mode
        </h1>
        <div className="text-lg sm:text-xl font-semibold text-gray-700 dark:text-gray-300">
          {getGameStatusMessage()}
        </div>
      </div>

      {/* Game Info & Captured Pieces Panel */}
      <div className="order-2 lg:order-1 space-y-4 lg:space-y-6 w-full max-w-sm">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-4 sm:p-6 border border-gray-200 dark:border-gray-700">
          <GameInfo
            currentPlayer={currentPlayer}
            gameStatus={gameStatus}
            moveHistory={moveHistory}
            capturedPieces={capturedPieces}
            onNewGame={resetGame}
            onUndoMove={undoLastMove}
          />
        </div>
        
        {/* Enhanced Captured Pieces Display */}
        <CapturedPieces capturedPieces={capturedPieces} />
        
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-4 border border-gray-200 dark:border-gray-700">
          <MoveIndicatorLegend />
        </div>
      </div>

      {/* Main Game Area */}
      <div className="order-1 lg:order-2 flex flex-col items-center w-full max-w-2xl">
        {/* Game Header - Desktop */}
        <div className="hidden lg:block text-center mb-6">
          <h1 className="text-5xl font-bold text-gray-900 dark:text-white mb-3 flex items-center justify-center gap-4">
            <span className="text-4xl">♟️</span>
            Practice Mode
          </h1>
          <div className="text-xl text-blue-600 dark:text-blue-400 mb-2 font-medium">
            Perfect your chess skills offline
          </div>
          <div className="text-2xl font-semibold text-gray-700 dark:text-gray-300 mb-2">
            {getGameStatusMessage()}
          </div>
          {(gameStatus.includes('checkmate') || gameStatus === 'check') && (
            <div className={`text-xl font-medium flex items-center justify-center ${gameStatus === 'check' ? 'text-red-600' : 'text-green-600'}`}>
              {gameStatus === 'check' ? (
                <>
                  <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                  Check!
                </>
              ) : (
                <>
                  <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                      d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                  </svg>
                  Game Over!
                </>
              )}
            </div>
          )}
        </div>

        {/* Chess Board */}
        <div className="relative flex flex-col items-center">
          {/* Board Labels */}
          <div className="absolute -left-8 top-0 h-full flex flex-col justify-around text-gray-600 dark:text-gray-400 font-semibold">
            {[8, 7, 6, 5, 4, 3, 2, 1].map(num => (
              <div key={num} className="h-16 flex items-center">
                {num}
              </div>
            ))}
          </div>
          
          <div className="absolute -bottom-8 left-0 w-full flex justify-around text-gray-600 dark:text-gray-400 font-semibold">
            {['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'].map(letter => (
              <div key={letter} className="w-16 text-center">
                {letter}
              </div>
            ))}
          </div>

          {/* Main Board */}
          <div className="border-4 border-gray-800 dark:border-gray-600 bg-gray-800 dark:bg-gray-700 p-3 rounded-xl shadow-2xl">
            <div className="grid grid-cols-8 gap-0 bg-white dark:bg-gray-100 p-1 rounded-lg">
              {board.map((row, rowIndex) =>
                row.map((piece, colIndex) => {
                  const isLight = (rowIndex + colIndex) % 2 === 0;
                  return (
                    <Square
                      key={`${rowIndex}-${colIndex}`}
                      piece={piece}
                      isLight={isLight}
                      isSelected={isSquareSelected(rowIndex, colIndex)}
                      isValidMove={isValidMoveSquare(rowIndex, colIndex)}
                      isCapture={isCaptureSquare(rowIndex, colIndex)}
                      isInCheck={isKingInCheck(rowIndex, colIndex)}
                      onClick={handleSquareClick}
                      row={rowIndex}
                      col={colIndex}
                    />
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Quick Controls - Mobile */}
        <div className="lg:hidden mt-6 flex gap-4">
          {onLeaveGame && (
            <button
              onClick={onLeaveGame}
              className="px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white font-semibold rounded-lg transition-colors duration-200 shadow-lg"
            >
              ← Back to Lobby
            </button>
          )}
          
          <button
            onClick={resetGame}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors duration-200 shadow-lg"
          >
            New Game
          </button>
          
          {selectedSquare && (
            <button
              onClick={deselectSquare}
              className="px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white font-semibold rounded-lg transition-colors duration-200 shadow-lg"
            >
              Deselect
            </button>
          )}
        </div>
      </div>

      {/* Empty space for balance on desktop */}
      <div className="hidden lg:block order-3 w-80"></div>
    </div>
  );
};

export default ChessBoard;
