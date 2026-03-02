'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import RoomLobby from './RoomLobby';
import GameBoard from './GameBoard';
import ReactChessboardWrapper from './ReactChessboardWrapper';
import Results from './Results';
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
  from: Position;
  to: Position;
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
  const [alertConfig, setAlertConfig] = useState<AlertConfig>({ 
    isOpen: false, 
    title: '', 
    message: '', 
    onConfirm: null, 
    type: 'info' 
  });

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

  // Calculate captured pieces from moves
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

    } catch {
      showToast.error('Failed to load game state');
    }
  }, [roomId, isGuest, guestData]);

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
      console.log('🎮 Game status:', data.game.gameStatus);
      
      // Force update game state
      setGameState({ ...data.game });
      
      // Update player color if provided
      if (data.playerColor !== null && data.playerColor !== undefined) {
        console.log('🎮 Setting playerColor to:', data.playerColor);
        setPlayerColor(data.playerColor);
      }
      setGameStatus(data.game.gameStatus);

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
        return {
          ...prev,
          board: data.fen || data.board, // Server sends 'fen', fallback to 'board'
          currentPlayer: data.currentPlayer,
          moves: [...(prev?.moves || []), data.move],
          gameStatus: data.gameStatus,
          result: data.result
        };
      });

      setSelectedSquare(null);
      setPossibleMoves([]);
      setCaptureMoves([]);
      setIsMyTurn(data.currentPlayer === playerColor);
      setIsInCheck(data.isCheck && data.currentPlayer === playerColor);
      
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
      setGameStatus('finished');
      
      setGameState(prev => {
        if (!prev) {
          console.log('⚠️ No game state when game ended, loading...');
          // If we don't have game state yet, load it and create a minimal state for now
          loadGameState();
          // Return minimal state to prevent null issues
          return {
            gameStatus: 'finished',
            result: data.result,
            players: data.game?.players || {},
            board: data.game?.board || null,
            currentPlayer: data.game?.currentPlayer || 'white',
            moves: data.game?.moves || []
          } as GameState;
        }
        return {
          ...prev,
          gameStatus: 'finished',
          result: data.result
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
      setDrawOffer(data);
      setShowDrawOfferDialog(true);
    };

    const handleDrawOfferSent = (data: any) => {
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
      setDrawOffer(null);
      setShowDrawOfferDialog(false);
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

  const handleSquareClick = useCallback((row: number, col: number) => {
    if (!isMyTurn || gameStatus !== 'active') {
      return;
    }

    const piece = gameState?.board?.[row]?.[col];

    if (!selectedSquare) {
      if (piece && piece.color === playerColor) {
        setSelectedSquare({ row, col });
        const movesWithTypes = getLegalMovesWithTypes(gameState!.board, row, col, piece, gameState!.castlingRights);
        const regularMoves = movesWithTypes.filter(move => !move.isCapture).map(move => [move.row, move.col] as [number, number]);
        const captures = movesWithTypes.filter(move => move.isCapture).map(move => [move.row, move.col] as [number, number]);
        setPossibleMoves(regularMoves);
        setCaptureMoves(captures);
      }
      return;
    }

    const { row: fromRow, col: fromCol } = selectedSquare;

    if (fromRow === row && fromCol === col) {
      setSelectedSquare(null);
      setPossibleMoves([]);
      setCaptureMoves([]);
      return;
    }

    if (piece && piece.color === playerColor) {
      setSelectedSquare({ row, col });
      const movesWithTypes = getLegalMovesWithTypes(gameState!.board, row, col, piece, gameState!.castlingRights);
      const regularMoves = movesWithTypes.filter(move => !move.isCapture).map(move => [move.row, move.col] as [number, number]);
      const captures = movesWithTypes.filter(move => move.isCapture).map(move => [move.row, move.col] as [number, number]);
      setPossibleMoves(regularMoves);
      setCaptureMoves(captures);
      return;
    }

    const moveTime = moveStartTime ? Date.now() - moveStartTime : 0;
    setLastMoveTime(moveTime);

    socketService.makeMove(roomId, { row: fromRow, col: fromCol }, { row, col }, moveStartTime);
  }, [isMyTurn, gameStatus, gameState, selectedSquare, playerColor, roomId, moveStartTime]);

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

  const handleResign = () => {
    setAlertConfig({
      isOpen: true,
      title: 'Resign Game',
      message: 'Are you sure you want to resign?',
      type: 'warning',
      onConfirm: () => {
        socketService.resign(roomId);
        setAlertConfig(prev => ({ ...prev, isOpen: false }));
      },
      showCancel: true
    });
  };

  const handleOfferDraw = () => {
    socketService.emit('offer_draw', { roomId });
  };

  const handleRespondToDraw = (accept: boolean) => {
    socketService.emit('respond_draw', { roomId, accept });
    setShowDrawOfferDialog(false);
    setDrawOffer(null);
  };

  const handleSendMessage = (message: string) => {
    socketService.sendMessage(roomId, message);
  };

  const handlePromotionSelect = (promotion: string) => {
    if (promotionData) {
      socketService.promotePawn(roomId, promotionData.from, promotionData.to, promotion);
      setPromotionData(null);
    }
  };

  const handlePromotionCancel = () => {
    setPromotionData(null);
  };

  // If game is finished but no gameState, show a minimal loading state but continue to render
  const hasValidGameState = gameState !== null;
  
  if (!hasValidGameState && gameStatus !== 'finished') {
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

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200 overflow-hidden">
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
          <GameBoard
            gameState={gameState}
            playerColor={playerColor}
            selectedSquare={selectedSquare}
            possibleMoves={possibleMoves}
            captureMoves={captureMoves}
            isMyTurn={isMyTurn}
            timeLeft={timeLeft}
            capturedPieces={capturedPieces}
            lastMove={lastMove}
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
          />
          
          {showResults && gameState && (
            <div className="max-w-7xl mx-auto px-4 py-6">
              <Results
                gameState={gameState}
                playerColor={playerColor}
                currentUsername={getCurrentUsername()}
                onPlayAgain={() => {
                  window.location.href = '/game-lobby';
                }}
                onLeaveGame={handleLeaveGame}
              />
            </div>
          )}
          
          {showResults && !gameState && (
            <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900 p-4">
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-8 max-w-md w-full text-center">
                <h2 className="text-3xl font-bold text-gray-800 dark:text-white mb-4">Game Ended</h2>
                <p className="text-gray-600 dark:text-gray-400 mb-6">The game has ended</p>
                <button
                  onClick={() => window.location.href = '/game-lobby'}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200"
                >
                  Return to Lobby
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default MultiplayerChessBoard;
