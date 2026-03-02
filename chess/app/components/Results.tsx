'use client';

import React, { useState, useEffect } from 'react';
import { useTheme } from '../hooks/useTheme';
import showToast from '../utils/toast';
import Square from './Square';
import { GameState } from '@/lib/utils/chessLogic';

interface ResultsProps {
  gameState: GameState;
  playerColor: 'white' | 'black' | null;
  currentUsername: string | null;
  onPlayAgain: () => void;
  onLeaveGame: () => void;
}

interface RankingPlayer {
  _id?: string;
  username: string;
  stats?: {
    rating?: number;
    gamesPlayed?: number;
    gamesWon?: number;
    gamesLost?: number;
    gamesDrawn?: number;
  };
}

interface ResultMessage {
  mainText: string;
  subText: string;
  isWinner: boolean | null;
  color: string;
}

const Results: React.FC<ResultsProps> = ({ 
  gameState, 
  playerColor,
  currentUsername,
  onPlayAgain,
  onLeaveGame
}) => {
  const theme = useTheme();
  const [rankings, setRankings] = useState<RankingPlayer[]>([]);
  const [loadingRankings, setLoadingRankings] = useState(true);

  useEffect(() => {
    fetchRankingsAndStats();
  }, []);

  const fetchRankingsAndStats = async () => {
    try {
      setLoadingRankings(true);
      
      const response = await fetch('/api/users/rankings', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setRankings(data.rankings || []);
      }
    } catch {
      setRankings([]);
    } finally {
      setLoadingRankings(false);
    }
  };

  const getResultMessage = (): ResultMessage => {
    if (!gameState?.result) return { mainText: 'Game Over', subText: '', isWinner: false, color: 'text-gray-500' };
    
    const { winner, reason } = gameState.result;
    
    if (winner === 'draw') {
      return {
        mainText: 'Draw',
        subText: reason === 'stalemate' ? 'Stalemate' : 
                 reason === 'draw_agreed' ? 'By Agreement' : 'Game Drawn',
        isWinner: null,
        color: 'text-yellow-500'
      };
    }
    
    const isWinner = winner === playerColor;
    const winnerName = winner === 'white' 
      ? gameState.players?.white?.username 
      : gameState.players?.black?.username;
    
    const reasonText = reason === 'checkmate' ? 'Checkmate' : 
                      reason === 'resignation' ? 'By Resignation' : 
                      reason === 'timeout' ? 'By Timeout' : 
                      reason === 'abandoned' ? 'Opponent Left' : '';
    
    if (isWinner) {
      return {
        mainText: 'You Win!',
        subText: reasonText,
        isWinner: true,
        color: 'text-green-500'
      };
    } else {
      return {
        mainText: `${winnerName} Wins`,
        subText: 'Defeat',
        isWinner: false,
        color: 'text-red-500'
      };
    }
  };

  const result = getResultMessage();

  const calculatePointsEarned = (): number => {
    if (!gameState?.result) return 0;
    const { winner } = gameState.result;
    if (winner === 'draw') return 5;
    if (winner === playerColor) return 20;
    return 0;
  };

  const pointsEarned = calculatePointsEarned();

  const getMoveHistory = () => {
    if (!gameState?.moves) return [];
    return gameState.moves.slice(-10).reverse();
  };

  // Convert FEN string to 2D board array
  const fenToBoard = (fen: string): any[][] => {
    if (!fen) return Array(8).fill(null).map(() => Array(8).fill(null));
    
    const rows = fen.split(' ')[0].split('/');
    const board: any[][] = [];
    
    const pieceMap: { [key: string]: string } = {
      'p': 'pawn', 'n': 'knight', 'b': 'bishop', 
      'r': 'rook', 'q': 'queen', 'k': 'king'
    };
    
    for (const row of rows) {
      const boardRow: any[] = [];
      for (const char of row) {
        if (char >= '1' && char <= '8') {
          // Empty squares
          const emptyCount = parseInt(char);
          for (let i = 0; i < emptyCount; i++) {
            boardRow.push(null);
          }
        } else {
          // Piece
          const color = char === char.toUpperCase() ? 'white' : 'black';
          const type = pieceMap[char.toLowerCase()];
          boardRow.push({ type, color });
        }
      }
      board.push(boardRow);
    }
    
    return board;
  };

  // Render the chess board - now handled by react-chessboard in main view
  const renderBoard = () => {
    return null;
  };

  return (
    <div className={`min-h-screen ${theme.colors.bg.primary} transition-colors duration-200 p-6 overflow-auto`}>
      <div className="max-w-7xl mx-auto">
        
        {/* Board with Result Overlay */}
        <div className="flex justify-center mb-8">
          {renderBoard()}
        </div>

        {/* Game Summary and Rankings */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          
          {/* Left Column - Game Summary */}
          <div className={`${theme.colors.bg.secondary} rounded-xl shadow-xl p-6 border ${theme.colors.border.primary}`}>
            <h2 className={`text-2xl font-bold ${theme.colors.text.primary} mb-6 flex items-center`}>
              <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                  d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              Game Summary
            </h2>

            {/* Points Earned */}
            <div className="bg-gradient-to-r from-yellow-50 to-yellow-100 dark:from-yellow-900/20 dark:to-yellow-800/20 rounded-lg p-4 mb-6 border-2 border-yellow-300 dark:border-yellow-700">
              <div className="flex items-center justify-between">
                <span className={`text-lg font-semibold ${theme.colors.text.primary}`}>
                  Points Earned
                </span>
                <span className="text-3xl font-bold text-yellow-600 dark:text-yellow-400">
                  +{pointsEarned}
                </span>
              </div>
            </div>

            {/* Players Stats */}
            <div className="space-y-4 mb-6">
              <div className={`p-4 rounded-lg ${theme.colors.bg.tertiary} border ${theme.colors.border.primary}`}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-white border-2 border-gray-400 rounded"></div>
                    <span className={`font-bold ${theme.colors.text.primary}`}>
                      {gameState?.players?.white?.username || 'White'}
                    </span>
                  </div>
                  {gameState?.result?.winner === 'white' && (
                    <span className="text-2xl">👑</span>
                  )}
                </div>
                <div className={`text-sm ${theme.colors.text.secondary}`}>
                  Moves: {gameState?.moves?.filter(m => m.piece?.color === 'white').length || 0}
                </div>
              </div>

              <div className={`p-4 rounded-lg ${theme.colors.bg.tertiary} border ${theme.colors.border.primary}`}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-gray-800 rounded"></div>
                    <span className={`font-bold ${theme.colors.text.primary}`}>
                      {gameState?.players?.black?.username || 'Black'}
                    </span>
                  </div>
                  {gameState?.result?.winner === 'black' && (
                    <span className="text-2xl">👑</span>
                  )}
                </div>
                <div className={`text-sm ${theme.colors.text.secondary}`}>
                  Moves: {gameState?.moves?.filter(m => m.piece?.color === 'black').length || 0}
                </div>
              </div>
            </div>

            {/* Recent Moves */}
            <div>
              <h3 className={`text-lg font-bold ${theme.colors.text.primary} mb-3`}>
                Recent Moves
              </h3>
              <div className={`${theme.colors.bg.tertiary} rounded-lg p-4 max-h-48 overflow-y-auto border ${theme.colors.border.primary}`}>
                {getMoveHistory().length > 0 ? (
                  <div className="space-y-2">
                    {getMoveHistory().map((move, index) => (
                      <div key={index} className={`flex items-center justify-between text-sm ${theme.colors.text.secondary}`}>
                        <span className="font-mono">
                          {move.notation || `${String.fromCharCode(97 + move.from.col)}${8 - move.from.row} → ${String.fromCharCode(97 + move.to.col)}${8 - move.to.row}`}
                        </span>
                        <span className={move.piece?.color === 'white' ? 'text-gray-600' : 'text-gray-800'}>
                          {move.piece?.type || ''}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className={theme.colors.text.muted}>No moves recorded</p>
                )}
              </div>
            </div>
          </div>

          {/* Right Column - Leaderboard */}
          <div className={`${theme.colors.bg.secondary} rounded-xl shadow-xl p-6 border ${theme.colors.border.primary}`}>
            <h2 className={`text-2xl font-bold ${theme.colors.text.primary} mb-6 flex items-center`}>
              <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                  d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              Global Rankings
            </h2>

            {loadingRankings ? (
              <div className="flex justify-center items-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              </div>
            ) : rankings.length > 0 ? (
              <div className="space-y-3">
                {rankings.slice(0, 10).map((player, index) => {
                  const isCurrentUser = player.username === currentUsername;
                  const medalEmojis = ['🥇', '🥈', '🥉'];
                  
                  return (
                    <div 
                      key={player._id || index}
                      className={`flex items-center justify-between p-4 rounded-lg transition-all duration-200 ${
                        isCurrentUser 
                          ? 'bg-blue-50 dark:bg-blue-900/30 border-2 border-blue-400 dark:border-blue-600 shadow-md' 
                          : theme.colors.bg.tertiary + ' border ' + theme.colors.border.primary
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-2xl font-bold w-8 text-center">
                          {index < 3 ? medalEmojis[index] : `${index + 1}.`}
                        </span>
                        <div>
                          <div className={`font-bold ${isCurrentUser ? 'text-blue-600 dark:text-blue-400' : theme.colors.text.primary}`}>
                            {player.username}
                            {isCurrentUser && <span className="ml-2 text-xs">(You)</span>}
                          </div>
                          <div className={`text-xs ${theme.colors.text.muted}`}>
                            {player.stats?.gamesWon || 0}W - {player.stats?.gamesLost || 0}L - {player.stats?.gamesDrawn || 0}D
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className={`text-xl font-bold ${theme.colors.text.accent}`}>
                          {player.stats?.rating || 1200}
                        </div>
                        <div className={`text-xs ${theme.colors.text.muted}`}>
                          {player.stats?.gamesPlayed || 0} games
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-12">
                <p className={`${theme.colors.text.secondary} mb-2`}>No rankings available</p>
                <p className={`text-sm ${theme.colors.text.muted}`}>Play more games to see rankings</p>
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4 justify-center">
          <button
            onClick={onPlayAgain}
            className={`${theme.colors.button.success} text-white px-8 py-4 rounded-lg text-lg font-bold transition-all duration-200 transform hover:scale-105 shadow-lg flex items-center gap-2`}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Play Again
          </button>
          <button
            onClick={onLeaveGame}
            className={`${theme.colors.button.secondary} text-white px-8 py-4 rounded-lg text-lg font-bold transition-all duration-200 shadow-lg flex items-center gap-2`}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            Back to Lobby
          </button>
        </div>
      </div>
    </div>
  );
};

export default Results;
