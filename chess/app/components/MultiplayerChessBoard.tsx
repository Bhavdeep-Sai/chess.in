'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import RoomLobby from './RoomLobby';
import GameBoard from './GameBoard';
import ReactChessboardWrapper from './ReactChessboardWrapper';
import Results from './Results';
import GameOverBanner from './GameOverBanner';
import MoveReplayControls from './MoveReplayControls';
import ErrorBoundary from './ErrorBoundary';
import socketService from '../services/socket';
import { gamesApi } from '../services/api';
import { getLegalMovesWithTypes } from '../utils/chess';
import showToast from '../utils/toast';
import CustomAlert from './CustomAlert';
import { Position, MoveWithTypes, GameState, Player, TimeControl, CapturedPieces, DrawOffer } from '@/lib/utils/chessLogic';

interface MultiplayerChessBoardProps {
  roomId: string;
  playerColor: 'white' | 'black' | null;
  isGuest: boolean;
  guestData?: {
    id: string;
    username: string;
  };
  onLeaveGame: () => void;
  password?: string;
}

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

interface AlertConfig {
  isOpen: boolean;
  title: string;
  message: string;
  onConfirm: (() => void) | null;
  type: 'info' | 'warning' | 'error' | 'success';
  showCancel?: boolean;
}

const MultiplayerChessBoard: React.FC<MultiplayerChessBoardProps> = ({ 
  roomId, 
  playerColor: initialPlayerColor, 
  isGuest, 
  guestData, 
  onLeaveGame, 
  password 
}) => {
  const isCleaningUp = useRef(false);
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [playerColor, setPlayerColor] = useState<'white' | 'black' | null>(initialPlayerColor);
  const [selectedSquare, setSelectedSquare] = useState<Position | null>(null);
  const [possibleMoves, setPossibleMoves] = useState<[number, number][]>([]);
  const [captureMoves, setCaptureMoves] = useState<[number, number][]>([]);
  const [illegalMoves, setIllegalMoves] = useState<[number, number][]>([]);
  const [illegalCaptures, setIllegalCaptures] = useState<[number, number][]>([]);
  const [isMyTurn, setIsMyTurn] = useState(false);
  const [gameStatus, setGameStatus] = useState<string>('waiting');
  const [timeLeft, setTimeLeft] = useState<{ white: number; black: number }>({ white: 0, black: 0 });
  const [isReady, setIsReady] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [connectionStatus, setConnectionStatus] = useState<string>('connecting');
  const [isInCheck, setIsInCheck] = useState(false);
  const [promotionData, setPromotionData] = useState<PromotionData | null>(null);
  const [bothPlayersReady, setBothPlayersReady] = useState(false);
  const [capturedPieces, setCapturedPieces] = useState<CapturedPieces>({ white: [], black: [] });
  const [moveStartTime, setMoveStartTime] = useState<number | null>(null);
  const [lastMoveTime, setLastMoveTime] = useState<number | null>(null);
  const [lastMove, setLastMove] = useState<any>(null);
  const [invalidMovePiece, setInvalidMovePiece] = useState<Position | null>(null);
  const [drawOffer, setDrawOffer] = useState<DrawOffer | null>(null);
  const [showDrawOfferDialog, setShowDrawOfferDialog] = useState(false);
  const [rematchRequested, setRematchRequested] = useState(false);
  const [opponentRematchRequested, setOpponentRematchRequested] = useState(false);
  const [alertConfig, setAlertConfig] = useState<AlertConfig>({ 
    isOpen: false, 
    title: '', 
    message: '', 
    onConfirm: null, 
    type: 'info' 
  });

  // 📜 MOVE REPLAY SYSTEM STATE (Production-Ready Architecture)
  // moveHistory[0] = initial position (no moves made)
  // moveHistory[1] = position after move 1
  // moveHistory[n] = position after move n
  // currentMoveIndex points to which position we're viewing
  const [moveHistory, setMoveHistory] = useState<any[]>([]);
  const [currentMoveIndex, setCurrentMoveIndex] = useState<number>(0);

  // 🛠️ UTILITY: Deep clone board state to avoid mutation
  const deepCloneBoard = useCallback((board: any) => {
    if (!board) return null;
    if (typeof board === 'string') return board; // FEN string
    return JSON.parse(JSON.stringify(board)); // 2D array
  }, []);

  // 🛠️ UTILITY: Calculate captured pieces from moves
  const calculateCapturedPieces = useCallback((moves: any[]) => {
    const captured: CapturedPieces = { white: [], black: [] };

    if (!moves || !Array.isArray(moves)) return captured;

    moves.forEach(move => {
      if (move.captured) {
        const capturedBy = move.piece?.color || 'white';
        captured[capturedBy].push(move.captured);
      }
    });

    return captured;
  }, []);

  // 🛠️ UTILITY: Create board snapshot (Deep clone to prevent mutation)
  const createBoardSnapshot = useCallback((currentGameState: GameState | null, moveNumber: number = 0) => {
    if (!currentGameState) return null;
    
    // For initial position (moveNumber = 0), no last move
    // For other positions, find the move at that index
    const lastMoveData = moveNumber > 0 && currentGameState.moves && currentGameState.moves.length >= moveNumber
      ? currentGameState.moves[moveNumber - 1]
      : null;
    
    // Calculate captured pieces up to this move
    const movesUpToNow = currentGameState.moves ? currentGameState.moves.slice(0, moveNumber) : [];
    
    return {
      board: deepCloneBoard(currentGameState.board),
      currentPlayer: currentGameState.currentPlayer,
      castlingRights: JSON.parse(JSON.stringify(currentGameState.castlingRights || {})),
      moves: [...movesUpToNow],
      lastMove: lastMoveData,
      capturedPieces: calculateCapturedPieces(movesUpToNow),
      moveNumber: moveNumber,
      timestamp: Date.now(),
      // Preserve all game state properties
      players: currentGameState.players,
      gameStatus: currentGameState.gameStatus,
      result: currentGameState.result
    };
  }, [deepCloneBoard, calculateCapturedPieces]);

  // Initialize socket connection
  useEffect(() => {
    const connectSocket = () => {
      if (isGuest && guestData) {
        socketService.connectAsGuest(guestData.id, guestData.username);
      } else {
        socketService.connect();
      }
    };

    connectSocket();

    let isMounted = true;
    let hasJoinedRoom = false;

    const joinRoomWhenReady = () => {
      if (!isMounted || isCleaningUp.current) {
        console.log('Not joining room - component unmounted or cleaning up');
        return;
      }

      if (!roomId) {
        console.log('No roomId provided');
        return;
      }

      if (!socketService.isSocketConnected()) {
        console.log('Socket not connected yet, waiting...');
        return;
      }

      if (hasJoinedRoom) {
        console.log('Already joined room');
        return;
      }

      console.log(`[MultiplayerChessBoard] Joining room ${roomId} as ${isGuest ? 'guest' : 'user'}`);
      socketService.joinRoom(roomId, password);
      hasJoinedRoom = true;
      setConnectionStatus('connected');
    };

    const handleConnect = () => {
      console.log('Socket connected event received');
      if (!isMounted || isCleaningUp.current) return;
      
      setTimeout(() => {
        joinRoomWhenReady();
      }, 500);
    };

    const handleDisconnect = () => {
      console.log('Socket disconnected');
      if (!isMounted) return;
      setConnectionStatus('connecting');
      hasJoinedRoom = false;
    };

    socketService.on('connect', handleConnect);
    socketService.on('disconnect', handleDisconnect);

    if (socketService.isSocketConnected()) {
      console.log('Socket already connected, joining room immediately');
      setTimeout(() => {
        joinRoomWhenReady();
      }, 100);
    }

    return () => {
      isMounted = false;
      socketService.off('connect', handleConnect);
      socketService.off('disconnect', handleDisconnect);
      if (!isCleaningUp.current) {
        socketService.clearCurrentRoom();
      }
    };
  }, [isGuest, guestData, roomId, password]);

  // Update captured pieces when game state changes
  useEffect(() => {
    if (gameState?.moves) {
      const newCapturedPieces = calculateCapturedPieces(gameState.moves);
      setCapturedPieces(newCapturedPieces);
    }
  }, [gameState?.moves, calculateCapturedPieces]);

  // Update isMyTurn when gameState or playerColor changes
  useEffect(() => {
    if (gameState && playerColor) {
      const myTurn = gameState.currentPlayer === playerColor;
      setIsMyTurn(myTurn);
    } else {
      setIsMyTurn(false);
    }
  }, [gameState, playerColor]);

  const loadGameState = useCallback(async () => {
    if (isCleaningUp.current) return;
    try {
      const response = await gamesApi.getGame(roomId, isGuest ? guestData?.id : null);
      const gameData = response.data.game;
      if (isCleaningUp.current) return;
      setGameState(gameData);
      setPlayerColor(response.data.playerColor);

      const hasWhitePlayer = gameData.players?.white?.userId || gameData.players?.white?.guestId || gameData.players?.white?.username;
      const hasBlackPlayer = gameData.players?.black?.userId || gameData.players?.black?.guestId || gameData.players?.black?.username;
      const whiteReady = gameData.players?.white?.isReady || false;
      const blackReady = gameData.players?.black?.isReady || false;
      setBothPlayersReady(!!(hasWhitePlayer && hasBlackPlayer && whiteReady && blackReady));
      
      // Initialize move history for loaded game
      // Start with current position - history will build as new moves are made
      if ((gameData.gameStatus === 'active' || gameData.gameStatus === 'finished')) {
        const currentMoveCount = gameData.moves?.length || 0;
        const snapshot = createBoardSnapshot(gameData, currentMoveCount);
        if (snapshot) {
          setMoveHistory([snapshot]);
          setCurrentMoveIndex(0); // Index 0 = current position when loading
        }
      }

    } catch {
      showToast.error('Failed to load game state');
    }
  }, [roomId, isGuest, guestData, createBoardSnapshot]);

  const handleLeaveGame = useCallback(() => {
    if (socketService.isSocketConnected() && roomId) {
      socketService.leaveRoom(roomId);
    }

    socketService.clearCurrentRoom();
    onLeaveGame();
  }, [roomId, onLeaveGame]);

  // Set up socket event listeners
  useEffect(() => {
    const handleGameState = (data: any) => {
      if (isCleaningUp.current) return;
      
      console.log('🎮 game_state received:', data);
      console.log('🎮 Current playerColor:', playerColor);
      console.log('🎮 Data playerColor:', data.playerColor);
      
      // Ensure data.game exists
      if (!data || !data.game) {
        console.error('Invalid game_state data received:', data);
        return;
      }
      
      console.log('🎮 Updating game state with players:', {
        white: data.game.players?.white,
        black: data.game.players?.black
      });
      console.log('🎮 Game status from server:', data.game.gameStatus);
      console.log('🎮 Current local gameStatus:', gameStatus);
      
      // Force update game state
      setGameState({ ...data.game });
      
      // Initialize move history if empty and game has started
      if (data.game.gameStatus === 'active' || data.game.gameStatus === 'finished') {
        setMoveHistory(prev => {
          if (prev.length === 0) {
            // Start with current position - history builds as new moves are made
            const currentMoveCount = data.game.moves?.length || 0;
            const snapshot = createBoardSnapshot(data.game, currentMoveCount);
            if (snapshot) {
              setCurrentMoveIndex(0); // Index 0 = current position when joining
              return [snapshot];
            }
          }
          return prev;
        });
      }
      
      // Update player color if provided
      if (data.playerColor !== null && data.playerColor !== undefined) {
        console.log('🎮 Setting playerColor to:', data.playerColor);
        setPlayerColor(data.playerColor);
      }
      
      // 🔒 CRITICAL: Only update gameStatus if not already finished
      // Once game is finished (by resignation/checkmate/etc), don't revert to active
      console.log('🎮 About to update gameStatus. Current:', gameStatus, '| From server:', data.game.gameStatus);
      setGameStatus(prevStatus => {
        // 🚨 NEVER revert from finished to any other status
        if (prevStatus === 'finished') {
          console.log('⚠️ Game already finished, BLOCKING status change from server');
          return 'finished';
        }
        // 🚨 If result exists, force status to finished regardless of server data
        if (data.game.result?.winner) {
          console.log('⚠️ Result exists in server data, FORCING status to finished');
          return 'finished';
        }
        console.log('✅ Updating gameStatus to:', data.game.gameStatus);
        return data.game.gameStatus;
      });

      if (playerColor && data.game?.players) {
        const isPlayerReady = playerColor === 'white' 
          ? data.game.players.white?.isReady 
          : data.game.players.black?.isReady;
        setIsReady(!!isPlayerReady);
      }

      if (data.game.timeControl) {
        setTimeLeft({
          white: data.game.timeControl.whiteTime,
          black: data.game.timeControl.blackTime
        });
      }

      const hasWhitePlayer = data.game.players?.white?.userId || data.game.players?.white?.guestId || data.game.players?.white?.username;
      const hasBlackPlayer = data.game.players?.black?.userId || data.game.players?.black?.guestId || data.game.players?.black?.username;
      const whiteReady = data.game.players?.white?.isReady || false;
      const blackReady = data.game.players?.black?.isReady || false;
      setBothPlayersReady(!!(hasWhitePlayer && hasBlackPlayer && whiteReady && blackReady));

      // Only show draw offer if it actually exists (from is not null)
      if (data.game.drawOffer && data.game.drawOffer.from) {
        setDrawOffer(data.game.drawOffer);
        const currentPlayer = data.playerColor === 'white' ? 'white' : 'black';
        if (data.game.drawOffer.from !== currentPlayer) {
          setShowDrawOfferDialog(true);
        }
      } else {
        setDrawOffer(null);
        setShowDrawOfferDialog(false);
      }

      setIsMyTurn(data.game.currentPlayer === data.playerColor);
      setConnectionStatus('connected');
    };

    const handleMoveMade = (data: any) => {
      console.log('📨 move_made received:', data);
      setGameState(prev => {
        if (!prev) return null;
        const updatedState = {
          ...prev,
          board: data.fen || data.board, // Server sends 'fen', fallback to 'board'
          currentPlayer: data.currentPlayer,
          moves: [...(prev?.moves || []), data.move],
          gameStatus: data.gameStatus,
          result: data.result
        };
        
        // Move index will be updated by the move history useEffect
        // This ensures the history and index stay in sync
        
        return updatedState;
      });

      setSelectedSquare(null);
      setPossibleMoves([]);
      setCaptureMoves([]);
      setIsMyTurn(data.currentPlayer === playerColor);
      // Set check status regardless of whose turn it is - we want to show the highlighted king
      setIsInCheck(data.isCheck);
      
      if (data.move) {
        setLastMove(data.move);
      }

      if (data.move && lastMoveTime) {
        data.move.moveTime = lastMoveTime;
        setLastMoveTime(null);
      }

      if (data.gameStatus === 'finished') {
        setGameStatus('finished');
      }
    };

    const handlePromotionRequired = (data: any) => {
      setPromotionData(data);
    };

    const handleChatMessage = (message: Message) => {
      setMessages(prev => [...prev, message]);
    };

    const handlePlayerJoined = (data: any) => {
      setMessages(prev => [...prev, {
        username: 'System',
        message: `${data.username} joined the game`,
        isSystem: true,
        timestamp: new Date()
      }]);
    };

    const handlePlayerDisconnected = (data: any) => {
      setMessages(prev => [...prev, {
        username: 'System',
        message: `${data.username} disconnected`,
        isSystem: true,
        timestamp: new Date()
      }]);
    };

    const handlePlayerLeft = (data: any) => {
      console.log('👋 Player left event received:', data);
      
      if (data.gameStatus === 'finished') {
        console.log('🏁 Game ended due to player leaving');
        console.log('Result:', data.result);
        console.log('Game data:', data.game);
        
        setGameStatus('finished');
        
        setGameState(prev => {
          console.log('Previous game state:', prev);
          
          if (!prev) {
            console.log('⚠️ No game state when player left, creating minimal state');
            // Create minimal state from the data
            const minimalState = {
              gameStatus: 'finished',
              result: data.result || { winner: 'white', reason: 'abandoned', endedAt: new Date() },
              players: data.game?.players || { white: {}, black: {} },
              board: data.game?.board || null,
              currentPlayer: data.game?.currentPlayer || 'white',
              moves: data.game?.moves || [],
              roomId: data.game?.roomId || roomId
            } as GameState;
            
            console.log('Created minimal state:', minimalState);
            // Also try to load complete state
            setTimeout(() => loadGameState(), 100);
            return minimalState;
          }
          
          const updatedState = {
            ...prev,
            gameStatus: 'finished',
            result: data.result
          };
          console.log('Updated existing state:', updatedState);
          return updatedState;
        });
      }

      setMessages(prev => [...prev, {
        username: 'System',
        message: `${data.username} left the game`,
        isSystem: true,
        timestamp: new Date()
      }]);
    };

    const handleGameStarted = (data: any) => {
      console.log('🎮 game_started received:', data);
      setGameStatus('active');
      
      if (data?.fen) {
        console.log('🎮 Initializing board with FEN:', data.fen);
        setGameState(prev => ({
          ...prev,
          board: data.fen,
          currentPlayer: 'white',
          gameStatus: 'active'
        }));
      }
      
      // Still load full game state from API for complete data
      loadGameState();
    };

    const handleGameEnded = (data: any) => {
      console.log('🏁 Game ended event received:', data);
      console.log('🏆 Winner from data:', data.winner);
      console.log('📋 Reason from data:', data.reason);
      console.log('📋 Result from data:', data.result);
      console.log('🎮 Game object:', data.game);
      
      console.log('🔴 SETTING GAME STATUS TO FINISHED - FORCED');
      // 🚨 CRITICAL: Force status to finished - this MUST stick
      setGameStatus(() => {
        console.log('🔴 INSIDE setGameStatus callback - returning FINISHED');
        return 'finished';
      });
      console.log('🔴 GAME STATUS SET TO FINISHED');
      
      setGameState(prev => {
        if (!prev) {
          console.log('⚠️ No game state when game ended');
          // If we don't have game state yet, create minimal state with result data
          const resultData = data.result || {
            winner: data.winner,
            reason: data.reason,
            method: data.reason
          };
          console.log('✅ Created new state with result:', resultData);
          return {
            gameStatus: 'finished',
            result: resultData,
            players: data.game?.players || {},
            board: data.game?.board || null,
            currentPlayer: data.game?.currentPlayer || 'white',
            moves: data.game?.moves || []
          } as GameState;
        }
        
        const resultData = data.result || {
          winner: data.winner,
          reason: data.reason,
          method: data.reason
        };
        console.log('✅ Updating game state with result:', resultData);
        
        return {
          ...prev,
          gameStatus: 'finished',
          result: resultData
        };
      });
    };

    const handleError = (error: any) => {
      if (error.message?.includes('password') || error.message?.includes('Authentication required')) {
        showToast.error(error.message || 'Authentication error');
        setTimeout(() => {
          handleLeaveGame();
        }, 2000);
        return;
      }

      if (error.message?.includes('not found') || error.message?.includes('room is full')) {
        showToast.error(error.message || 'Room error');
        setTimeout(() => {
          handleLeaveGame();
        }, 2000);
        return;
      }

      const currentIsMyTurn = gameState?.currentPlayer === playerColor;
      const shouldShowError = currentIsMyTurn && (
        error.message?.includes('Invalid move') ||
        error.message?.includes('Not your turn') ||
        error.message?.includes('Game not found') ||
        error.message?.includes('Game is not active') ||
        error.message?.includes('You are not a player') ||
        error.message?.includes('Failed to')
      );
      
      const isCheckError = error.message?.includes('Move would put your king in check');
      
      if (shouldShowError || (isCheckError && currentIsMyTurn)) {
        showToast.error(error.message || 'An error occurred');
      } else if (!isCheckError && 
          !error.message?.includes('Invalid move') &&
          !error.message?.includes('Not your turn')) {
        showToast.error(error.message || 'An error occurred');
      }
    };

    const handleInvalidMove = (data: any) => {
      setInvalidMovePiece(data.piece);
      setSelectedSquare(null);
      setPossibleMoves([]);
      setCaptureMoves([]);
      
      setTimeout(() => {
        setInvalidMovePiece(null);
      }, 2000);
    };

    const handleDrawOffered = (data: any) => {
      console.log('🤝 Draw offer received from opponent:', data);
      setDrawOffer(data);
      setShowDrawOfferDialog(true);
      showToast.info('Your opponent has offered a draw');
      setMessages(prev => [...prev, {
        id: Date.now(),
        username: 'System',
        message: `${data.fromUsername || data.from} has offered a draw`,
        timestamp: new Date(),
        type: 'system'
      }]);
    };

    const handleDrawOfferSent = (data: any) => {
      console.log('🤝 Draw offer sent confirmation:', data);
      setDrawOffer(data);
      setMessages(prev => [...prev, {
        id: Date.now(),
        username: 'System',
        message: 'Draw offer sent to opponent',
        timestamp: new Date(),
        type: 'system'
      }]);
    };

    const handleDrawDeclined = () => {
      console.log('🤝 Draw offer declined by opponent');
      setDrawOffer(null);
      setShowDrawOfferDialog(false);
      showToast.info('Draw offer was declined');
      setMessages(prev => [...prev, {
        id: Date.now(),
        username: 'System',
        message: 'Draw offer declined',
        timestamp: new Date(),
        type: 'system'
      }]);
    };

    const handleRoomClosed = (data: any) => {
      console.log('Room closed by host:', data);
      isCleaningUp.current = true;
      socketService.clearCurrentRoom();
      onLeaveGame();
      
      setTimeout(() => {
        showToast.error(data.message || 'The host has closed the room');
      }, 100);
    };

    const handleKickedFromRoom = (data: any) => {
      console.log('Kicked from room:', data);
      isCleaningUp.current = true;
      socketService.clearCurrentRoom();
      onLeaveGame();
      
      setTimeout(() => {
        showToast.error(data.message || 'You have been removed from the room');
      }, 100);
    };

    const handleRematchRequested = (data: any) => {
      console.log('🔄 Rematch requested by opponent:', data);
      const isMyRequest = (playerColor === data.from);
      
      if (!isMyRequest) {
        setOpponentRematchRequested(true);
        showToast.info(`${data.fromUsername} wants a rematch!`);
      }
    };

    const handleRematchCancelled = (data: any) => {
      console.log('❌ Rematch cancelled:', data);
      const isMyCancel = (playerColor === data.from);
      
      if (!isMyCancel) {
        setOpponentRematchRequested(false);
        showToast.info('Opponent cancelled rematch request');
      }
    };

    const handleGameReset = (data: any) => {
      console.log('🎮 Game reset for rematch:', data);
      showToast.success('Rematch started!');
      
      // Reset all game state
      setRematchRequested(false);
      setOpponentRematchRequested(false);
      setGameStatus('active');
      setDrawOffer(null);
      setShowDrawOfferDialog(false);
      setSelectedSquare(null);
      setPossibleMoves([]);
      setCaptureMoves([]);
      setIllegalMoves([]);
      setIllegalCaptures([]);
      setInvalidMovePiece(null);
      
      // CRITICAL: Reset move history for new game
      setMoveHistory([]);
      setCurrentMoveIndex(0);
      
      // Load the new game state
      loadGameState();
    };

    socketService.on('game_state', handleGameState);
    socketService.on('move_made', handleMoveMade);
    socketService.on('promotion_required', handlePromotionRequired);
    socketService.on('chat_message', handleChatMessage);
    socketService.on('player_joined', handlePlayerJoined);
    socketService.on('player_disconnected', handlePlayerDisconnected);
    socketService.on('player_left', handlePlayerLeft);
    socketService.on('game_started', handleGameStarted);
    socketService.on('game_ended', handleGameEnded);
    socketService.on('error', handleError);
    socketService.on('invalid_move', handleInvalidMove);
    socketService.on('draw_offered', handleDrawOffered);
    socketService.on('draw_offer_sent', handleDrawOfferSent);
    socketService.on('draw_declined', handleDrawDeclined);
    socketService.on('rematch_requested', handleRematchRequested);
    socketService.on('rematch_cancelled', handleRematchCancelled);
    socketService.on('game_reset', handleGameReset);
    socketService.on('room_closed', handleRoomClosed);
    socketService.on('kicked_from_room', handleKickedFromRoom);

    return () => {
      if (!isCleaningUp.current) {
        socketService.off('game_state', handleGameState);
        socketService.off('move_made', handleMoveMade);
        socketService.off('promotion_required', handlePromotionRequired);
        socketService.off('chat_message', handleChatMessage);
        socketService.off('player_joined', handlePlayerJoined);
        socketService.off('player_disconnected', handlePlayerDisconnected);
        socketService.off('player_left', handlePlayerLeft);
        socketService.off('game_started', handleGameStarted);
        socketService.off('game_ended', handleGameEnded);
        socketService.off('error', handleError);
        socketService.off('invalid_move', handleInvalidMove);
        socketService.off('draw_offered', handleDrawOffered);
        socketService.off('draw_offer_sent', handleDrawOfferSent);
        socketService.off('draw_declined', handleDrawDeclined);
        socketService.off('rematch_requested', handleRematchRequested);
        socketService.off('rematch_cancelled', handleRematchCancelled);
        socketService.off('game_reset', handleGameReset);
        socketService.off('room_closed', handleRoomClosed);
        socketService.off('kicked_from_room', handleKickedFromRoom);
      }
    };
  }, [playerColor, roomId, loadGameState, gameState, gameStatus, lastMoveTime, handleLeaveGame, onLeaveGame]);

  useEffect(() => {
    if (!isCleaningUp.current) {
      loadGameState();
    }
  }, [loadGameState]);

  // Timer effect
  useEffect(() => {
    if (gameStatus !== 'active' || !gameState) return;

    const interval = setInterval(() => {
      setTimeLeft(prev => {
        const newTime = { ...prev };
        if (gameState.currentPlayer === 'white') {
          newTime.white = Math.max(0, newTime.white - 1000);
          if (newTime.white === 0 && prev.white > 0) {
            socketService.declareTimeout(roomId, 'white');
          }
        } else {
          newTime.black = Math.max(0, newTime.black - 1000);
          if (newTime.black === 0 && prev.black > 0) {
            socketService.declareTimeout(roomId, 'black');
          }
        }
        return newTime;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [gameStatus, gameState, roomId]);

  // Track turn start time for move timing
  useEffect(() => {
    if (isMyTurn && gameStatus === 'active') {
      setMoveStartTime(Date.now());
    }
  }, [isMyTurn, gameStatus]);

  // Emergency fallback to set playerColor
  useEffect(() => {
    if (!playerColor && gameState && (isGuest && guestData)) {
      if (gameState.players?.white?.guestId === guestData.id || 
          gameState.players?.white?.username === guestData.username) {
        setPlayerColor('white');
      } else if (gameState.players?.black?.guestId === guestData.id || 
                gameState.players?.black?.username === guestData.username) {
        setPlayerColor('black');
      }
    }
  }, [playerColor, gameState, isGuest, guestData]);

  // 🚨 EMERGENCY STATUS FIX - If result exists but status is wrong, force correction
  useEffect(() => {
    if (gameState?.result?.winner && gameStatus !== 'finished') {
      console.error('⚠️⚠️⚠️ EMERGENCY FIX TRIGGERED: Result exists but status not finished!');
      console.error('Forcing gameStatus to finished...');
      setGameStatus('finished');
    }
  }, [gameState?.result?.winner, gameStatus]);

  const handleSquareClick = useCallback((row: number, col: number) => {
    // Prevent moves if viewing past positions (not at latest move)
    const isAtLatest = currentMoveIndex === moveHistory.length - 1;
    if (!isAtLatest) {
      showToast.info('Return to latest move to play');
      return;
    }

    // Prevent all moves if game is not active
    if (gameStatus !== 'active') {
      console.log('⛔ Board locked - game status:', gameStatus);
      return;
    }

    if (!isMyTurn) {
      console.log('⛔ Not your turn');
      return;
    }

    const piece = gameState?.board?.[row]?.[col];

    if (!selectedSquare) {
      if (piece && piece.color === playerColor) {
        setSelectedSquare({ row, col });
        
        // Import functions we need
        const { getLegalMoves, getPossibleMoves } = require('@/lib/utils/chessLogic');
        
        // Get ALL possible moves (including illegal ones)
        const allPossibleMoves = getPossibleMoves(gameState!.board, row, col, piece, gameState!.castlingRights);
        
        // Get LEGAL moves (those that don't leave king in check)
        const legalMoves = getLegalMoves(gameState!.board, row, col, piece, gameState!.castlingRights);
        
        // Separate into legal and illegal moves
        const legalMovesSet = new Set(legalMoves.map(([r, c]) => `${r},${c}`));
        const illegal: [number, number][] = [];
        const illegalCaps: [number, number][] = [];
        const legal: [number, number][] = [];
        const legalCaps: [number, number][] = [];
        
        allPossibleMoves.forEach(([moveRow, moveCol]) => {
          const isLegal = legalMovesSet.has(`${moveRow},${moveCol}`);
          const isCapture = gameState!.board[moveRow][moveCol] !== null;
          
          if (isLegal) {
            if (isCapture) {
              legalCaps.push([moveRow, moveCol]);
            } else {
              legal.push([moveRow, moveCol]);
            }
          } else {
            if (isCapture) {
              illegalCaps.push([moveRow, moveCol]);
            } else {
              illegal.push([moveRow, moveCol]);
            }
          }
        });
        
        setPossibleMoves(legal);
        setCaptureMoves(legalCaps);
        setIllegalMoves(illegal);
        setIllegalCaptures(illegalCaps);
        
        // Show feedback if no legal moves during check
        if (isInCheck && legal.length === 0 && legalCaps.length === 0) {
          console.log('⚠️ No legal moves available - piece cannot help resolve check');
          showToast.info('This piece cannot help resolve the check');
        }
      }
      return;
    }

    const { row: fromRow, col: fromCol } = selectedSquare;

    if (fromRow === row && fromCol === col) {
      setSelectedSquare(null);
      setPossibleMoves([]);
      setCaptureMoves([]);
      setIllegalMoves([]);
      setIllegalCaptures([]);
      return;
    }

    if (piece && piece.color === playerColor) {
      setSelectedSquare({ row, col });
      
      // Import functions we need
      const { getLegalMoves, getPossibleMoves } = require('@/lib/utils/chessLogic');
      
      // Get ALL possible moves (including illegal ones)
      const allPossibleMoves = getPossibleMoves(gameState!.board, row, col, piece, gameState!.castlingRights);
      
      // Get LEGAL moves (those that don't leave king in check)
      const legalMoves = getLegalMoves(gameState!.board, row, col, piece, gameState!.castlingRights);
      
      // Separate into legal and illegal moves
      const legalMovesSet = new Set(legalMoves.map(([r, c]) => `${r},${c}`));
      const illegal: [number, number][] = [];
      const illegalCaps: [number, number][] = [];
      const legal: [number, number][] = [];
      const legalCaps: [number, number][] = [];
      
      allPossibleMoves.forEach(([moveRow, moveCol]) => {
        const isLegal = legalMovesSet.has(`${moveRow},${moveCol}`);
        const isCapture = gameState!.board[moveRow][moveCol] !== null;
        
        if (isLegal) {
          if (isCapture) {
            legalCaps.push([moveRow, moveCol]);
          } else {
            legal.push([moveRow, moveCol]);
          }
        } else {
          if (isCapture) {
            illegalCaps.push([moveRow, moveCol]);
          } else {
            illegal.push([moveRow, moveCol]);
          }
        }
      });
      
      setPossibleMoves(legal);
      setCaptureMoves(legalCaps);
      setIllegalMoves(illegal);
      setIllegalCaptures(illegalCaps);
      return;
    }

    // Check if this is a legal move before executing
    const isLegalMove = possibleMoves.some(([r, c]) => r === row && c === col) || 
                        captureMoves.some(([r, c]) => r === row && c === col);
    
    if (!isLegalMove) {
      // Invalid move - show feedback and reset
      console.log('❌ Illegal move - does not resolve check or is invalid');
      showToast.error('Invalid move! This move would leave your king in check.');
      setInvalidMovePiece({ row: fromRow, col: fromCol });
      setTimeout(() => setInvalidMovePiece(null), 500);
      setSelectedSquare(null);
      setPossibleMoves([]);
      setCaptureMoves([]);
      setIllegalMoves([]);
      setIllegalCaptures([]);
      return;
    }

    const moveTime = moveStartTime ? Date.now() - moveStartTime : 0;
    setLastMoveTime(moveTime);

    socketService.makeMove(roomId, { row: fromRow, col: fromCol }, { row, col }, moveStartTime);
  }, [isMyTurn, gameStatus, gameState, selectedSquare, playerColor, roomId, moveStartTime, isInCheck, possibleMoves, captureMoves, showToast, currentMoveIndex, moveHistory.length]);

  const handleMoveAttempt = useCallback((from: string, to: string) => {
    console.log('🎯 Move attempt:', from, '->', to);
    console.log('🎯 isMyTurn:', isMyTurn, 'gameStatus:', gameStatus);
    
    if (!isMyTurn || gameStatus !== 'active') {
      console.log('❌ Cannot move - not your turn or game not active');
      return;
    }

    console.log('📤 Sending move to server...');
    // Send move to server
    socketService.makeMove(roomId, from, to, Date.now());
  }, [isMyTurn, gameStatus, roomId]);

  const handleCloseRoom = () => {
    if (!socketService.isSocketConnected()) {
      showToast.error('Cannot close room - not connected to server');
      return;
    }
    
    isCleaningUp.current = true;
    
    const socket = socketService.getSocket();
    socket.emit('close_room', { roomId });
    
    socketService.clearCurrentRoom();
    onLeaveGame();
  };

  const handleKickPlayer = (color: 'white' | 'black') => {
    const playerToKick = gameState?.players?.[color];
    if (playerToKick && playerToKick.username) {
      setAlertConfig({
        isOpen: true,
        title: 'Remove Player',
        message: `Are you sure you want to remove ${playerToKick.username} from the room?`,
        type: 'warning',
        onConfirm: () => {
          socketService.emit('kick_player', { roomId, playerColor: color });
          setAlertConfig(prev => ({ ...prev, isOpen: false }));
        },
        showCancel: true
      });
    }
  };

  const getCurrentUsername = useCallback(() => {
    if (isGuest && guestData) {
      return guestData.username;
    }
    
    if (gameState && playerColor) {
      return gameState.players?.[playerColor]?.username;
    }
    
    return null;
  }, [isGuest, guestData, gameState, playerColor]);

  const isHost = useCallback(() => {
    if (!gameState || !gameState.players || !gameState.players.white) {
      return false;
    }

    const whitePlayer = gameState.players.white;
    
    if (isGuest && guestData) {
      return whitePlayer.guestId === guestData.id || whitePlayer.username === guestData.username;
    }
    
    return playerColor === 'white';
  }, [gameState, playerColor, isGuest, guestData]);

  const handlePlayerReady = () => {
    socketService.playerReady(roomId);
    setIsReady(true);
  };

  // 📜 MOVE REPLAY NAVIGATION HANDLERS (Chess.com/Lichess Style)
  const handleBackward = useCallback(() => {
    // Bounds check: can't go before initial position
    if (currentMoveIndex <= 0 || moveHistory.length === 0) {
      console.log('⬅️ Already at initial position');
      return;
    }
    
    const newIndex = currentMoveIndex - 1;
    console.log(`⬅️ Navigating backward: ${currentMoveIndex} → ${newIndex}`);
    
    setCurrentMoveIndex(newIndex);
    
    // Clear selections when navigating
    setSelectedSquare(null);
    setPossibleMoves([]);
    setCaptureMoves([]);
    setIllegalMoves([]);
    setIllegalCaptures([]);
  }, [currentMoveIndex, moveHistory.length]);

  const handleForward = useCallback(() => {
    const maxIndex = moveHistory.length - 1;
    
    // Bounds check: can't go beyond latest move
    if (currentMoveIndex >= maxIndex || moveHistory.length === 0) {
      console.log('➡️ Already at latest position');
      return;
    }
    
    const newIndex = currentMoveIndex + 1;
    console.log(`➡️ Navigating forward: ${currentMoveIndex} → ${newIndex}`);
    
    setCurrentMoveIndex(newIndex);
    
    // Clear selections when navigating
    setSelectedSquare(null);
    setPossibleMoves([]);
    setCaptureMoves([]);
    setIllegalMoves([]);
    setIllegalCaptures([]);
  }, [currentMoveIndex, moveHistory.length]);

  const handleExitReplay = useCallback(() => {
    console.log('⏭️ Returning to latest move');
    
    if (moveHistory.length === 0) return;
    
    const latestIndex = moveHistory.length - 1;
    setCurrentMoveIndex(latestIndex);
    
    // Clear selections
    setSelectedSquare(null);
    setPossibleMoves([]);
    setCaptureMoves([]);
    setIllegalMoves([]);
    setIllegalCaptures([]);
  }, [moveHistory.length]);

  // 📜 Initialize move history with initial position
  useEffect(() => {
    if (!gameState) return;
    
    // Only initialize if history is empty
    if (moveHistory.length === 0) {
      console.log('📚 Initializing move history with initial position');
      const initialSnapshot = createBoardSnapshot(gameState, 0);
      if (initialSnapshot) {
        setMoveHistory([initialSnapshot]);
        setCurrentMoveIndex(0);
      }
    }
  }, [gameState, moveHistory.length, createBoardSnapshot]);

  // 📜 Update move history when new moves are made
  useEffect(() => {
    if (!gameState || !gameState.moves) return;
    
    const currentMoveCount = gameState.moves.length;
    const historyMoveCount = moveHistory.length - 1; // -1 because index 0 is initial position
    
    // New move detected
    if (currentMoveCount > historyMoveCount) {
      console.log(`📚 New move detected: ${historyMoveCount} → ${currentMoveCount}`);
      
      const snapshot = createBoardSnapshot(gameState, currentMoveCount);
      if (snapshot) {
        setMoveHistory(prev => [...prev, snapshot]);
        
        // ALWAYS move to latest when new moves come in (follow the game in real-time)
        // Only stay at current position if user is actively reviewing (not at latest before this move)
        const wasAtLatest = currentMoveIndex === moveHistory.length - 1;
        if (wasAtLatest) {
          setCurrentMoveIndex(prev => prev + 1);
        }
      }
    }
  }, [gameState?.moves?.length, moveHistory.length, createBoardSnapshot, currentMoveIndex]);

  // ⌨️ KEYBOARD SHORTCUTS for replay navigation
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // Only work if there are moves to navigate
      if (moveHistory.length === 0) return;
      
      // Don't interfere with input fields
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        handleBackward();
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        handleForward();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        handleExitReplay();
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [handleBackward, handleForward, handleExitReplay, moveHistory.length]);

  const handleResign = () => {
    // 🔒 Prevent resign if game already ended
    if (gameStatus !== 'active') {
      console.log('⛔ Cannot resign - game already ended');
      showToast.error('Game has already ended');
      return;
    }

    setAlertConfig({
      isOpen: true,
      title: '🏳️ Resign Game',
      message: 'Are you sure you want to resign? Your opponent will be declared the winner.',
      type: 'warning',
      onConfirm: () => {
        console.log('✅ Player confirmed resignation');
        console.log('📤 Sending resign event to server');
        
        // 🔴 CRITICAL: Immediately set status to 'finished' locally with callback
        // Don't wait for server response - prevents race conditions
        console.log('🔴 PRE-EMPTIVELY setting gameStatus to finished');
        setGameStatus(() => {
          console.log('🔴 INSIDE handleResign setGameStatus - returning FINISHED');
          return 'finished';
        });
        
        // Send resign to server
        socketService.resign(roomId);
        
        setAlertConfig(prev => ({ ...prev, isOpen: false }));
        
        // Server will send back game_ended event with final result
        console.log('✅ Resign sent, waiting for server confirmation');
      },
      showCancel: true
    });
  };

  const handleOfferDraw = () => {
    // 🔒 Prevent draw offer if game already ended
    if (gameStatus !== 'active') {
      console.log('⛔ Cannot offer draw - game already ended');
      showToast.error('Game has already ended');
      return;
    }

    // Prevent multiple draw offers
    if (drawOffer) {
      console.log('⛔ Draw offer already pending');
      showToast.info('Draw offer already pending');
      return;
    }

    console.log('🤝 Sending draw offer');
    socketService.emit('offer_draw', { roomId });
    showToast.success('Draw offer sent to opponent');
  };

  const handleRespondToDraw = (accept: boolean) => {
    console.log(`🤝 Responding to draw offer: ${accept ? 'ACCEPT' : 'DECLINE'}`);
    socketService.emit('respond_draw', { roomId, accept });
    setShowDrawOfferDialog(false);
    
    if (accept) {
      showToast.success('Draw accepted - Game ended');
      // Game state will be updated by server response
    } else {
      showToast.info('Draw offer declined');
      setDrawOffer(null);
    }
  };

  const handleRequestRematch = () => {
    console.log('🔄 Requesting rematch');
    if (!rematchRequested) {
      socketService.emit('request_rematch', { roomId });
      setRematchRequested(true);
      showToast.success('Rematch requested!');
    } else {
      // Cancel rematch
      socketService.emit('cancel_rematch', { roomId });
      setRematchRequested(false);
      showToast.info('Rematch request cancelled');
    }
  };

  const handleSendMessage = (message: string) => {
    socketService.sendMessage(roomId, message);
  };

  const handlePromotionSelect = (promotion: string) => {
    if (promotionData) {
      console.log('🎯 Player selected promotion:', promotion, 'for move', promotionData.from, '->', promotionData.to);
      socketService.promotePawn(roomId, promotionData.from, promotionData.to, promotion);
      setPromotionData(null);
    }
  };

  const handlePromotionCancel = () => {
    console.log('❌ Player cancelled promotion');
    if (promotionData) {
      socketService.emit('cancel_promotion', { roomId });
    }
    setPromotionData(null);
  };

  // 🛡️ CRITICAL: Render state validation and debugging
  const hasValidGameState = gameState !== null;
  
  // 🔍 Comprehensive state debugging
  console.log('🔍 === RENDER CYCLE DEBUG START ===');
  console.log('🎮 gameStatus:', gameStatus);
  console.log('📊 hasValidGameState:', hasValidGameState);
  console.log('📦 gameState:', gameState ? 'exists' : 'null');
  console.log('🏆 result:', gameState?.result);
  console.log('📜 moveHistory length:', moveHistory.length);
  console.log('🔢 currentMoveIndex:', currentMoveIndex);
  console.log('🔍 === RENDER CYCLE DEBUG END ===');
  
  if (!hasValidGameState && gameStatus !== 'finished') {
    console.log('⏳ Showing loading state (no game state)');
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading game...</p>
        </div>
      </div>
    );
  }

  const showLobby = gameStatus === 'waiting' && !bothPlayersReady;
  const showGame = (gameStatus === 'active' || gameStatus === 'finished' || (gameStatus === 'waiting' && bothPlayersReady));
  const showResults = gameStatus === 'finished';
  
  // 🚨 CRITICAL FIX: Show banner if result exists, regardless of gameStatus race condition
  // This handles case where result is set but gameStatus hasn't updated yet
  const showGameOverBanner = (gameStatus === 'finished' && gameState?.result) || 
                             (gameState?.result?.winner && gameState?.result?.reason);
  
  console.log('🎮 Render flags:', {
    showLobby,
    showGame,
    showResults,
    showGameOverBanner,
    gameStatus,
    hasResult: !!gameState?.result,
    resultWinner: gameState?.result?.winner,
    resultReason: gameState?.result?.reason
  });
  
  // 📜 PRODUCTION-READY BOARD STATE DETERMINATION
  // CRITICAL: Board must NEVER be null or undefined
  // Always use a valid snapshot from moveHistory
  const getDisplayState = () => {
    // Safety: Ensure moveHistory has data
    if (moveHistory.length === 0) {
      console.warn('⚠️ No move history available, using current game state');
      return gameState;
    }
    
    // Safety: Ensure currentMoveIndex is within bounds
    const safeIndex = Math.max(0, Math.min(currentMoveIndex, moveHistory.length - 1));
    
    // Get the snapshot at current index
    const snapshot = moveHistory[safeIndex];
    
    if (!snapshot) {
      console.error('❌ Snapshot is null at index', safeIndex);
      return gameState;
    }
    
    // Merge snapshot with current game state to preserve all properties
    return {
      ...gameState,
      board: snapshot.board,
      currentPlayer: snapshot.currentPlayer,
      castlingRights: snapshot.castlingRights,
      moves: snapshot.moves || []
    };
  };
  
  const displayGameState = getDisplayState();
  
  // 🛡️ CRITICAL: Ensure we ALWAYS have a valid game state for rendering
  // Multiple fallback layers prevent blank screen on state updates
  const safeDisplayGameState = displayGameState || gameState || {
    board: Array(8).fill(null).map(() => Array(8).fill(null)),
    currentPlayer: 'white' as const,
    castlingRights: { white: { kingSide: false, queenSide: false }, black: { kingSide: false, queenSide: false } },
    moves: [],
    gameStatus: gameStatus,
    players: {},
    result: gameState?.result
  };
  
  console.log('🛡️ Safe display state prepared:', {
    hasDisplayState: !!displayGameState,
    hasGameState: !!gameState,
    hasFallback: !!safeDisplayGameState,
    board: safeDisplayGameState.board ? 'exists' : 'null'
  });
  
  // Get last move and captured pieces from current snapshot
  const getCurrentSnapshot = () => {
    if (moveHistory.length === 0) return null;
    const safeIndex = Math.max(0, Math.min(currentMoveIndex, moveHistory.length - 1));
    return moveHistory[safeIndex];
  };
  
  const currentSnapshot = getCurrentSnapshot();
  const displayLastMove = currentSnapshot?.lastMove || null;
  const displayCapturedPieces = currentSnapshot?.capturedPieces || capturedPieces;

  // 🛡️ FINAL RENDER GUARD - Log what will be rendered
  console.log('🚀 === FINAL RENDER DECISION ===');
  console.log('showLobby:', showLobby);
  console.log('showGame:', showGame);
  console.log('showGameOverBanner:', showGameOverBanner);
  console.log('safeDisplayGameState valid:', !!safeDisplayGameState?.board);
  console.log('🚀 === END RENDER DECISION ===');

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200 overflow-hidden">
      {/* Visual indicator for finished games - helps debug */}
      {gameStatus === 'finished' && (
        <div className="fixed top-4 right-4 z-50 bg-red-500 text-white px-4 py-2 rounded-lg shadow-lg">
          🏁 Game Finished
        </div>
      )}
      
      <CustomAlert
        isOpen={alertConfig.isOpen}
        onClose={() => setAlertConfig(prev => ({ ...prev, isOpen: false }))}
        title={alertConfig.title}
        message={alertConfig.message}
        onConfirm={alertConfig.onConfirm}
        type={alertConfig.type}
        showCancel={alertConfig.showCancel}
      />
      
      {showLobby && (
        <RoomLobby
          roomId={roomId}
          gameState={gameState}
          playerColor={playerColor}
          isReady={isReady}
          isHost={isHost()}
          connectionStatus={connectionStatus}
          onPlayerReady={handlePlayerReady}
          onKickPlayer={handleKickPlayer}
          onCloseRoom={handleCloseRoom}
          onLeaveGame={handleLeaveGame}
        />
      )}

      {showGame && (
        <>
          {console.log('✅ Rendering game section. showGameOverBanner:', showGameOverBanner)}
          
          {/* Game Over Banner Overlay - Shows when game finishes */}
          {showGameOverBanner && (
            <GameOverBanner
              winner={gameState?.result?.winner || 'white'}
              reason={gameState?.result?.reason || 'resignation'}
              playerColor={playerColor}
              whiteUsername={gameState?.players?.white?.username || 'White'}
              blackUsername={gameState?.players?.black?.username || 'Black'}
              onPlayAgain={handleRequestRematch}
              onReturnToLobby={() => window.location.href = '/game-lobby'}
              rematchRequested={rematchRequested}
              opponentRematchRequested={opponentRematchRequested}
              onCancelRematch={handleRequestRematch}
            />
          )}

          {console.log('🎯 About to render GameBoard')}
          {/* CRITICAL: Always render GameBoard when game is shown - never conditionally hide it */}
          {/* Wrapped in ErrorBoundary to catch any runtime errors */}
          <ErrorBoundary>
            <GameBoard
              gameState={safeDisplayGameState}
              playerColor={playerColor}
              selectedSquare={selectedSquare}
              possibleMoves={possibleMoves}
              captureMoves={captureMoves}
              illegalMoves={illegalMoves}
              illegalCaptures={illegalCaptures}
              isMyTurn={isMyTurn}
              timeLeft={timeLeft}
              capturedPieces={displayCapturedPieces}
              lastMove={displayLastMove}
              invalidMovePiece={invalidMovePiece}
              isInCheck={isInCheck}
              promotionData={promotionData}
              drawOffer={drawOffer}
              showDrawOfferDialog={showDrawOfferDialog}
              messages={messages}
              currentUsername={getCurrentUsername()}
              onSquareClick={handleSquareClick}
              onPromotionSelect={handlePromotionSelect}
              onPromotionCancel={handlePromotionCancel}
              onOfferDraw={handleOfferDraw}
              onRespondToDraw={handleRespondToDraw}
              onResign={handleResign}
              onSendMessage={handleSendMessage}
              onMoveAttempt={handleMoveAttempt}
              roomId={roomId}
              gameStatus={gameStatus}
              replayControls={
                <MoveReplayControls
                  currentMoveIndex={currentMoveIndex}
                  totalMoves={moveHistory.length > 0 ? moveHistory.length - 1 : 0}
                  onBackward={handleBackward}
                  onForward={handleForward}
                  onExitReplay={handleExitReplay}
                  disabled={gameStatus !== 'active' && gameStatus !== 'finished'}
                  currentMoveNumber={currentSnapshot?.moveNumber ?? 0}
                  totalGameMoves={gameState?.moves?.length ?? 0}
                />
              }
            />
          </ErrorBoundary>
        </>
      )}
    </div>
  );
};

export default MultiplayerChessBoard;
