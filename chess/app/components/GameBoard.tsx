'use client';

import React from 'react';
import Square from './Square';
import ReactChessboardWrapper from './ReactChessboardWrapper';
import ChatBox from './ChatBox';
import MoveHistory from './MoveHistory';
import PromotionModal from './PromotionModal';
import CapturedPieces from './CapturedPieces';
import { useTheme } from '../hooks/useTheme';
import { Position, GameState, CapturedPieces as CapturedPiecesType, DrawOffer } from '@/lib/utils/chessLogic';

interface Message {
  id?: number;
  username: string;
  message: string;
  isSystem?: boolean;
  timestamp: Date;
  type?: string;
}

interface PromotionData {
  from: string | Position;
  to: string | Position;
  color?: 'white' | 'black';
}

interface GameBoardProps {
  gameState: GameState;
  playerColor: 'white' | 'black' | null;
  selectedSquare: Position | null;
  possibleMoves: [number, number][];
  captureMoves: [number, number][];
  illegalMoves?: [number, number][];
  illegalCaptures?: [number, number][];
  isMyTurn: boolean;
  timeLeft: { white: number; black: number };
  capturedPieces: CapturedPiecesType;
  lastMove: any;
  invalidMovePiece: Position | null;
  isInCheck: boolean;
  promotionData: PromotionData | null;
  drawOffer: DrawOffer | null;
  showDrawOfferDialog: boolean;
  messages: Message[];
  currentUsername: string | null;
  onSquareClick: (row: number, col: number) => void;
  onPromotionSelect: (promotion: string) => void;
  onPromotionCancel: () => void;
  onOfferDraw: () => void;
  onRespondToDraw: (accept: boolean) => void;
  onResign: () => void;
  onSendMessage: (message: string) => void;
  onMoveAttempt?: (from: string, to: string) => void;
  roomId?: string;
  gameStatus?: string;
  replayControls?: React.ReactNode;
}

const GameBoard: React.FC<GameBoardProps> = ({ 
  gameState,
  playerColor,
  selectedSquare,
  possibleMoves,
  captureMoves,
  illegalMoves = [],
  illegalCaptures = [],
  isMyTurn,
  timeLeft,
  capturedPieces,
  lastMove,
  invalidMovePiece,
  isInCheck,
  promotionData,
  drawOffer,
  showDrawOfferDialog,
  messages,
  currentUsername,
  onSquareClick,
  onPromotionSelect,
  onPromotionCancel,
  onOfferDraw,
  onRespondToDraw,
  onResign,
  onSendMessage,
  onMoveAttempt,
  roomId,
  gameStatus = 'active',
  replayControls
}) => {
  const theme = useTheme();

  const formatTime = (milliseconds: number): string => {
    const totalSeconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const isKingInCheck = (row: number, col: number): boolean => {
    if (!gameState?.board) return false;
    const piece = gameState.board[row][col];
    // Highlight the king that is currently in check (current player's king)
    if (!piece || piece.type !== 'king' || !isInCheck) return false;
    // Check if this king's color matches the current player (who is in check)
    const currentPlayerColor = gameState.currentPlayer;
    return piece.color === currentPlayerColor;
  };

  const isSquareSelected = (row: number, col: number): boolean => {
    return !!(selectedSquare && selectedSquare.row === row && selectedSquare.col === col);
  };

  const isValidMoveSquare = (row: number, col: number): boolean => {
    return possibleMoves.some(([moveRow, moveCol]) => moveRow === row && moveCol === col);
  };

  const isCaptureSquare = (row: number, col: number): boolean => {
    return captureMoves.some(([moveRow, moveCol]) => moveRow === row && moveCol === col);
  };

  const isIllegalMoveSquare = (row: number, col: number): boolean => {
    return illegalMoves.some(([moveRow, moveCol]) => moveRow === row && moveCol === col);
  };

  const isIllegalCaptureSquare = (row: number, col: number): boolean => {
    return illegalCaptures.some(([moveRow, moveCol]) => moveRow === row && moveCol === col);
  };

  const isLastMoveSquare = (row: number, col: number): boolean => {
    if (!lastMove) return false;
    return (lastMove.from.row === row && lastMove.from.col === col) ||
           (lastMove.to.row === row && lastMove.to.col === col);
  };

  const isInvalidMoveSquare = (row: number, col: number): boolean => {
    return !!(invalidMovePiece && invalidMovePiece.row === row && invalidMovePiece.col === col);
  };

  return (
    <div className={`min-h-screen flex items-center justify-center ${theme.colors.bg.primary} transition-colors duration-200 overflow-hidden`}>
      <div className="flex flex-row items-stretch justify-center gap-6 w-full h-screen p-6">
        
        {/* Left Panel - Game Info */}
        <div className="w-80 flex flex-col justify-center shrink-0">
          {/* Captured Pieces */}
          <div className="mb-4">
            <CapturedPieces capturedPieces={capturedPieces} />
          </div>

          {/* Game Info Card */}
          <div className={`${theme.colors.bg.secondary} rounded-lg shadow-lg p-6 border ${theme.colors.border.primary}`}>
            {/* Player Info */}
            <div className="space-y-3 mb-6">
              <div className={`flex items-center justify-between p-3 rounded-lg transition-all duration-200 ${
                gameState.currentPlayer === 'white' 
                  ? `${theme.colors.text.accent} bg-blue-50 dark:bg-blue-900/30 border-2 border-blue-200 dark:border-blue-700 shadow-md` 
                  : theme.colors.bg.tertiary
              }`}>
                <div className="flex items-center gap-2">
                  <div className={`w-4 h-4 bg-white border-2 border-gray-400 rounded ${
                    gameState.currentPlayer === 'white' ? 'animate-pulse shadow-lg' : ''
                  }`}></div>
                  <span className={`font-medium ${
                    gameState.currentPlayer === 'white' ? theme.colors.text.accent : theme.colors.text.primary
                  }`}>
                    {gameState.players?.white?.username || 'White'}
                  </span>
                </div>
                <div className={`font-mono text-lg font-bold ${
                  timeLeft.white < 30000 ? 'text-red-600 animate-pulse' : theme.colors.text.secondary
                }`}>
                  {formatTime(timeLeft.white)}
                </div>
              </div>

              <div className={`flex items-center justify-between p-3 rounded-lg transition-all duration-200 ${
                gameState.currentPlayer === 'black' 
                  ? `${theme.colors.text.accent} bg-blue-50 dark:bg-blue-900/30 border-2 border-blue-200 dark:border-blue-700 shadow-md` 
                  : theme.colors.bg.tertiary
              }`}>
                <div className="flex items-center gap-2">
                  <div className={`w-4 h-4 bg-gray-800 rounded ${
                    gameState.currentPlayer === 'black' ? 'animate-pulse shadow-lg' : ''
                  }`}></div>
                  <span className={`font-medium ${
                    gameState.currentPlayer === 'black' ? theme.colors.text.accent : theme.colors.text.primary
                  }`}>
                    {gameState.players?.black?.username || 'Black'}
                  </span>
                </div>
                <div className={`font-mono text-lg font-bold ${
                  timeLeft.black < 30000 ? 'text-red-600 animate-pulse' : theme.colors.text.secondary
                }`}>
                  {formatTime(timeLeft.black)}
                </div>
              </div>
            </div>

            {/* Turn Indicator */}
            <div className={`text-center py-3 rounded-lg mb-4 font-bold text-lg ${
              isMyTurn 
                ? 'bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300 border-2 border-green-300 dark:border-green-700'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 border-2 border-gray-300 dark:border-gray-600'
            }`}>
              {isMyTurn ? '✓ Your Turn' : "Opponent's Turn"}
            </div>

            {/* Draw Offer Dialog */}
            {showDrawOfferDialog && drawOffer && (
              <div className={`${theme.colors.bg.secondary} border-2 border-blue-500 p-4 rounded-lg shadow-lg mb-4`}>
                <h3 className={`text-lg font-bold ${theme.colors.text.primary} mb-2 text-center`}>
                  Draw Offer
                </h3>
                <p className={`${theme.colors.text.secondary} mb-4 text-center text-sm`}>
                  {drawOffer.fromUsername || drawOffer.from} offers a draw
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => onRespondToDraw(true)}
                    className={`flex-1 ${theme.colors.button.success} text-white py-2 px-3 rounded-md transition-colors duration-200 text-sm font-bold`}
                  >
                    Accept
                  </button>
                  <button
                    onClick={() => onRespondToDraw(false)}
                    className={`flex-1 ${theme.colors.button.danger} text-white py-2 px-3 rounded-md transition-colors duration-200 text-sm font-bold`}
                  >
                    Decline
                  </button>
                </div>
              </div>
            )}

            {/* Game Controls */}
            <div className="space-y-2">
              <button
                onClick={onOfferDraw}
                disabled={!!drawOffer || gameStatus !== 'active'}
                className={`w-full ${
                  drawOffer || gameStatus !== 'active'
                    ? 'bg-gray-400 cursor-not-allowed' 
                    : theme.colors.button.primary
                } text-white py-3 rounded-lg transition-colors duration-200 font-semibold`}
              >
                {drawOffer ? 'Draw Offer Pending' : 'Offer Draw'}
              </button>
              <button
                onClick={onResign}
                disabled={gameStatus !== 'active'}
                className={`w-full ${
                  gameStatus !== 'active'
                    ? 'bg-gray-400 cursor-not-allowed'
                    : theme.colors.button.danger
                } text-white py-3 rounded-lg transition-colors duration-200 font-semibold`}
              >
                Resign
              </button>
            </div>
          </div>
        </div>

        {/* Center Panel - Chess Board */}
        <div className="flex-1 flex flex-col justify-center items-center max-w-3xl">
          {/* Use react-chessboard if onMoveAttempt is provided, otherwise use custom board */}
          {onMoveAttempt && roomId ? (
            <div className={`w-full max-w-2xl relative ${gameStatus !== 'active' ? 'opacity-75 pointer-events-none' : ''}`}>
              {gameStatus !== 'active' && (
                <div className="absolute inset-0 bg-gray-900 bg-opacity-20 z-10 rounded-lg flex items-center justify-center">
                  <div className="text-white text-xl font-bold bg-black bg-opacity-50 px-6 py-3 rounded-lg">
                    Game Ended
                  </div>
                </div>
              )}
              <ReactChessboardWrapper
                roomId={roomId}
                playerColor={playerColor}
                gameState={gameState}
                isMyTurn={isMyTurn}
                onMoveAttempt={onMoveAttempt}
              />
            </div>
          ) : (
            <div className={`relative ${gameStatus !== 'active' ? 'opacity-75' : ''}`} style={{ padding: '30px', backgroundColor: '#eeeed2', boxShadow: '0 10px 40px rgba(0,0,0,0.3)' }}>
              {gameStatus !== 'active' && (
                <div className="absolute inset-0 bg-gray-900 bg-opacity-30 z-10 rounded-lg flex items-center justify-center">
                  <div className="text-white text-2xl font-bold bg-black bg-opacity-50 px-6 py-3 rounded-lg">
                    Game Ended
                  </div>
                </div>
              )}
              {/* Board Labels - Ranks (Numbers) */}
              <div className="absolute left-3 top-7 h-[640px] flex flex-col justify-around font-bold text-base" style={{ color: '#654321' }}>
                {(playerColor === 'black' ? [1, 2, 3, 4, 5, 6, 7, 8] : [8, 7, 6, 5, 4, 3, 2, 1]).map(num => (
                  <div key={num} className="h-20 flex items-center">
                    {num}
                  </div>
                ))}
              </div>

              {/* Board Labels - Files (Letters) */}
              <div className="absolute bottom-0 left-8 w-[640px] flex justify-around font-bold text-base" style={{ color: '#654321' }}>
                {(playerColor === 'black' ? ['h', 'g', 'f', 'e', 'd', 'c', 'b', 'a'] : ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h']).map(letter => (
                  <div key={letter} className="w-20 text-center">
                    {letter}
                  </div>
                ))}
              </div>

              {/* Chess Board */}
              <div className="shadow-inner" style={{ border: '3px solid #769656' }}>
                <div className="grid grid-cols-8" style={{ gap: 0, lineHeight: 0 }}>
                  {Array.from({ length: 8 }, (_, rowIndex) =>
                    Array.from({ length: 8 }, (_, colIndex) => {
                      const actualRow = playerColor === 'black' ? 7 - rowIndex : rowIndex;
                      const actualCol = playerColor === 'black' ? 7 - colIndex : colIndex;
                      const actualPiece = gameState.board?.[actualRow]?.[actualCol];
                      const isLight = (actualRow + actualCol) % 2 === 0;

                      return (
                        <Square
                          key={`${actualRow}-${actualCol}`}
                          piece={actualPiece}
                          isLight={isLight}
                          isSelected={isSquareSelected(actualRow, actualCol)}
                          isValidMove={isValidMoveSquare(actualRow, actualCol)}
                          isCapture={isCaptureSquare(actualRow, actualCol)}
                          isIllegalMove={isIllegalMoveSquare(actualRow, actualCol)}
                          isIllegalCapture={isIllegalCaptureSquare(actualRow, actualCol)}
                          isLastMove={isLastMoveSquare(actualRow, actualCol)}
                          isCheck={isKingInCheck(actualRow, actualCol)}
                          isInvalidMove={isInvalidMoveSquare(actualRow, actualCol)}
                          onClick={() => onSquareClick(actualRow, actualCol)}
                          row={actualRow}
                          col={actualCol}
                        />
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Panel - Move History & Chat */}
        <div className="w-80 flex flex-col justify-center shrink-0 space-y-4">
          <MoveHistory 
            moves={gameState?.moves || []}
            currentPlayer={gameState?.currentPlayer}
          />
          
          {/* Move Navigator */}
          {replayControls && (
            <div>
              {replayControls}
            </div>
          )}
          
          <ChatBox
            messages={messages}
            onSendMessage={onSendMessage}
            disabled={false}
            currentUsername={currentUsername}
          />
        </div>
      </div>

      {/* Promotion Modal */}
      <PromotionModal
        isOpen={promotionData !== null}
        playerColor={promotionData?.color || playerColor || 'white'}
        onSelect={onPromotionSelect}
        onCancel={onPromotionCancel}
      />
    </div>
  );
};

export default GameBoard;
