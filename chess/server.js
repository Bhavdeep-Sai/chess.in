import { createServer } from 'http';
import { parse } from 'url';
import next from 'next';
import { Server as SocketIOServer } from 'socket.io';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import { Chess } from 'chess.js';
import { User, Game } from './lib/models/index.js';

const dev = process.env.NODE_ENV !== 'production';
const hostname = 'localhost';
const port = parseInt(process.env.PORT || '3000', 10);

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(async () => {
  const server = createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url || '/', true);
      await handle(req, res, parsedUrl);
    } catch (err) {
      console.error('Error occurred handling', req.url, err);
      res.statusCode = 500;
      res.end('Internal server error');
    }
  });

  // Initialize Socket.IO with proper configuration
  const io = new SocketIOServer(server, {
    path: '/socket.io',
    cors: {
      origin: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
      methods: ['GET', 'POST'],
      credentials: true
    },
    // Allow Socket.io to coexist with Next.js HMR
    serveClient: false,
    transports: ['polling', 'websocket'],
    allowEIO3: true
  });

  // Connect to MongoDB
  if (process.env.MONGODB_URI) {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');
  }

  // Socket.IO middleware for authentication
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      const guestId = socket.handshake.auth.guestId;
      const guestUsername = socket.handshake.auth.guestUsername;

      if (token && process.env.JWT_SECRET) {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.userId);

        if (user) {
          socket.userId = user._id.toString();
          socket.username = user.username;
          socket.isGuest = false;
        }
      } else if (guestId && guestUsername) {
        socket.guestId = guestId;
        socket.username = guestUsername;
        socket.isGuest = true;
      }

      next();
    } catch (error) {
      console.error('Socket auth error:', error);
      next();
    }
  });

  // Helper function to get online user count
  const getOnlineUserCount = () => {
    const sockets = io.sockets.sockets;
    const uniqueUsers = new Set();

    sockets.forEach(socket => {
      if (socket.userId) {
        uniqueUsers.add(`user_${socket.userId}`);
      } else if (socket.guestId) {
        uniqueUsers.add(`guest_${socket.guestId}`);
      } else {
        uniqueUsers.add(`socket_${socket.id}`);
      }
    });

    return uniqueUsers.size;
  };

  // Helper function to broadcast user count to all clients
  const broadcastUserCount = () => {
    const count = getOnlineUserCount();
    io.emit('user_count', count);
  };

  // Quick Match Algorithm - Find or create a waiting room
  const findOrCreateQuickMatchRoom = async (socket, data) => {
    try {
      // Build query to exclude own rooms
      const excludeQuery = {
        gameStatus: 'waiting',
        'settings.isPrivate': false,
        $or: [
          { 'players.black.userId': null, 'players.black.guestId': null },
          { 'players.black': { $exists: false } }
        ]
      };
      
      // Exclude rooms created by this user
      if (data.isGuest && socket.guestId) {
        excludeQuery['players.white.guestId'] = { $ne: socket.guestId };
      } else if (socket.userId) {
        excludeQuery['players.white.userId'] = { $ne: socket.userId };
      }
      
      // Step 1: Find an available waiting room (not created by same user)
      const availableRoom = await Game.findOne(excludeQuery).sort({ createdAt: 1 }); // Oldest first
      
      if (availableRoom) {
        // Join existing room
        console.log('Joining existing room:', availableRoom.roomId);
        
        // Update game with second player
        availableRoom.players.black = {
          userId: data.isGuest ? null : socket.userId,
          username: data.isGuest ? data.guestUsername : socket.username,
          isGuest: data.isGuest || false,
          guestId: data.isGuest ? socket.guestId : null,
          socketId: socket.id,
          isReady: false
        };
        // Keep status as 'waiting' until both players are ready
        // availableRoom.gameStatus = 'active';
        await availableRoom.save();
        
        // Join socket room
        socket.join(availableRoom.roomId);
        
        // Emit game state to both players with their respective colors
        const whiteSocketId = availableRoom.players.white.socketId;
        const blackSocketId = socket.id;
        
        // Send to white player
        if (whiteSocketId) {
          io.to(whiteSocketId).emit('game_state', {
            roomId: availableRoom.roomId,
            game: availableRoom,
            playerColor: 'white'
          });
        }
        
        // Send to black player (the one who just joined)
        io.to(blackSocketId).emit('game_state', {
          roomId: availableRoom.roomId,
          game: availableRoom,
          playerColor: 'black'
        });
        
        // Emit to both players
        io.to(availableRoom.roomId).emit('game_joined', {
          roomId: availableRoom.roomId,
          game: availableRoom
        });
        
        // Broadcast lobby update - game is ready but not started yet
        io.emit('lobby_update', {
          action: 'players_ready',
          game: availableRoom
        });
        
        // Navigate creator to game
        socket.emit('game_created', {
          roomId: availableRoom.roomId,
          game: availableRoom
        });
        
        return availableRoom.roomId;
      } else {
        // Step 2: Create new room
        const roomId = Math.random().toString(36).substr(2, 9);
        console.log('Creating new room:', roomId);
        
        const newGame = new Game({
          roomId: roomId,
          name: data.name || 'Quick Match',
          createdBy: data.isGuest ? null : socket.userId,
          gameStatus: 'waiting',
          timeControl: {
            initialTime: data.timeControl?.initialTime || 600000,
            increment: data.timeControl?.increment || 0,
            whiteTime: data.timeControl?.initialTime || 600000,
            blackTime: data.timeControl?.initialTime || 600000
          },
          settings: {
            isPrivate: false,
            password: null,
            autoStart: false
          },
          players: {
            white: {
              userId: data.isGuest ? null : socket.userId,
              username: data.isGuest ? data.guestUsername : socket.username,
              isGuest: data.isGuest || false,
              guestId: data.isGuest ? socket.guestId : null,
              socketId: socket.id,
              isReady: false
            },
            black: {
              userId: null,
              username: null,
              isGuest: false,
              guestId: null,
              socketId: null,
              isReady: false
            }
          }
        });
        
        await newGame.save();
        
        console.log('✅ New room created and saved:', roomId, 'Game Status:', newGame.gameStatus);
        
        // Join socket room
        socket.join(roomId);
        
        // Send game state to creator with their color
        socket.emit('game_state', {
          roomId: roomId,
          game: newGame,
          playerColor: 'white'
        });
        
        // Emit success to creator
        socket.emit('game_created', {
          roomId: roomId,
          game: newGame
        });
        
        console.log('📢 Broadcasting lobby_update to all clients');
        // Broadcast to all clients
        io.emit('lobby_update', {
          action: 'game_created',
          game: newGame
        });
        
        return roomId;
      }
    } catch (error) {
      console.error('Error in quick match:', error);
      socket.emit('error', { message: 'Failed to find or create game' });
      return null;
    }
  };

  // Helper function to check and delete empty rooms
  const checkAndDeleteEmptyRoom = async (roomId) => {
    try {
      const game = await Game.findOne({ roomId });
      
      if (!game) return;
      
      // Check if room is empty (no connected players)
      const socketsInRoom = io.sockets.adapter.rooms.get(roomId);
      const isEmpty = !socketsInRoom || socketsInRoom.size === 0;
      
      if (isEmpty) {
        console.log('Deleting empty room:', roomId);
        await Game.deleteOne({ roomId });
        
        // Broadcast lobby update
        io.emit('lobby_update', {
          action: 'game_deleted',
          roomId: roomId
        });
      } else {
        // Room has players but someone left, notify remaining players
        io.to(roomId).emit('room_closed', {
          roomId: roomId,
          message: 'The room creator has left. Room will be closed.'
        });
        
        // Delete the room anyway
        await Game.deleteOne({ roomId });
        
        // Broadcast lobby update
        io.emit('lobby_update', {
          action: 'game_deleted',
          roomId: roomId
        });
      }
    } catch (error) {
      console.error('Error checking/deleting empty room:', error);
    }
  };

  // Cleanup abandoned rooms on startup and periodically
  const cleanupAbandonedRooms = async () => {
    try {
      // Check if Game model is registered
      if (!mongoose.models.Game) {
        console.log('Game model not yet registered, skipping cleanup');
        return;
      }
      
      // Delete all waiting rooms older than 5 minutes
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
      const result = await Game.deleteMany({
        gameStatus: 'waiting',
        createdAt: { $lt: fiveMinutesAgo }
      });
      
      if (result.deletedCount > 0) {
        console.log(`Cleaned up ${result.deletedCount} abandoned rooms`);
        io.emit('lobby_update', { action: 'refresh' });
      }
    } catch (error) {
      console.error('Error cleaning up abandoned rooms:', error);
    }
  };

  // Run cleanup after a delay to ensure models are loaded
  setTimeout(cleanupAbandonedRooms, 3000);

  // Run cleanup every 2 minutes
  setInterval(cleanupAbandonedRooms, 2 * 60 * 1000);

  // Socket.IO connection handling
  io.on('connection', (socket) => {
    // Broadcast updated user count when someone connects
    setTimeout(() => {
      broadcastUserCount();
    }, 100);

    // Handle request for user count
    socket.on('request_user_count', () => {
      const count = getOnlineUserCount();
      socket.emit('user_count', count);
    });

    socket.on('disconnect', async () => {
      // Get all rooms this socket was in
      const rooms = Array.from(socket.rooms);
      
      // Check and delete empty rooms
      for (const roomId of rooms) {
        if (roomId !== socket.id) { // Skip the default socket room
          await checkAndDeleteEmptyRoom(roomId);
        }
      }
      
      // Broadcast updated user count when someone disconnects
      // Small delay to ensure socket is removed from collection
      setTimeout(() => {
        broadcastUserCount();
      }, 100);
    });

    // Room management - Use quick match algorithm
    socket.on('create_room', async (data) => {
      try {
        console.log('Create room (Quick Match):', data);
        
        // Use quick match algorithm
        await findOrCreateQuickMatchRoom(socket, data);
      } catch (error) {
        console.error('Error creating room:', error);
        socket.emit('error', { message: 'Failed to create room' });
      }
    });

    socket.on('join_room', async (data) => {
      try {
        console.log('Join room:', data);
        
        const game = await Game.findOne({ roomId: data.roomId });
        
        if (!game) {
          socket.emit('error', { message: 'Game not found' });
          return;
        }
        
        if (game.settings?.isPrivate && data.password !== game.settings?.password) {
          socket.emit('error', { message: 'Incorrect password' });
          return;
        }
        
        // Determine if joining as guest
        const isGuest = Boolean(!socket.userId && socket.guestId);
        const username = isGuest ? socket.username : (socket.username || 'Player');
        const userId = isGuest ? null : socket.userId;
        const guestId = isGuest ? socket.guestId : null;
        
        // Check if user is already in the game
        const whitePlayer = game.players.white;
        const blackPlayer = game.players.black;
        
        const isWhitePlayer = (userId && whitePlayer?.userId?.toString() === userId) || 
                              (guestId && whitePlayer?.guestId === guestId);
        const isBlackPlayer = (userId && blackPlayer?.userId?.toString() === userId) || 
                              (guestId && blackPlayer?.guestId === guestId);
        
        if (isWhitePlayer || isBlackPlayer) {
          // Player is already in the game, just rejoin the socket room
          socket.join(data.roomId);
          
          // Update the player's socketId in case they reconnected
          const playerColor = isWhitePlayer ? 'white' : 'black';
          if (playerColor === 'white') {
            game.players.white.socketId = socket.id;
          } else {
            game.players.black.socketId = socket.id;
          }
          await game.save();
          
          console.log(`Player rejoined room as ${playerColor}, updated socketId:`, socket.id);
          
          // Send current game state with proper format
          socket.emit('game_state', {
            roomId: data.roomId,
            game: game,
            playerColor: playerColor
          });
          
          // Also emit game_created for navigation
          socket.emit('game_created', {
            roomId: data.roomId,
            game: game
          });
          
          return;
        }
        
        // Check if user is trying to join their own game
        if ((userId && whitePlayer?.userId?.toString() === userId) || 
            (guestId && whitePlayer?.guestId === guestId)) {
          socket.emit('error', { message: 'You cannot join your own game' });
          return;
        }
        
        // Join the socket room
        socket.join(data.roomId);
        
        // Update game with second player
        if (!blackPlayer || (!blackPlayer.userId && !blackPlayer.guestId)) {
          game.players.black = {
            userId: userId,
            username: username,
            isGuest: isGuest,
            guestId: guestId,
            socketId: socket.id,
            isReady: false
          };
          // Keep status as 'waiting' until both players are ready
          // game.gameStatus = 'active';
          await game.save();
          
          console.log('Second player joined:', game.players.black);
          
          // Emit game state to both players with their respective colors
          const whiteSocketId = game.players.white.socketId;
          const blackSocketId = game.players.black.socketId;
          
          console.log('📤 Emitting game_state to white player:', whiteSocketId);
          console.log('📤 Emitting game_state to black player:', blackSocketId);
          
          // Send to white player
          if (whiteSocketId) {
            io.to(whiteSocketId).emit('game_state', {
              roomId: data.roomId,
              game: game,
              playerColor: 'white'
            });
          }
          
          // Send to black player (the one who just joined)
          io.to(blackSocketId).emit('game_state', {
            roomId: data.roomId,
            game: game,
            playerColor: 'black'
          });
          
          // Also emit game_created to the joining player for navigation
          socket.emit('game_created', {
            roomId: data.roomId,
            game: game
          });
        }
        
        // Emit to both players (for backwards compatibility)
        io.to(data.roomId).emit('game_joined', {
          roomId: data.roomId,
          game: game
        });
        
        // Broadcast lobby update - game is ready but not started yet
        io.emit('lobby_update', {
          action: 'players_ready',
          game: game
        });
        
        console.log('Player joined room:', data.roomId);
      } catch (error) {
        console.error('Error joining room:', error);
        console.error('Error details:', error.message, error.stack);
        socket.emit('error', { message: `Failed to join room: ${error.message}` });
      }
    });

    socket.on('leave_room', async (data) => {
      try {
        console.log('Leave room:', data);
        socket.leave(data.roomId);
        
        // Check if room is now empty and delete if so
        await checkAndDeleteEmptyRoom(data.roomId);
      } catch (error) {
        console.error('Error leaving room:', error);
      }
    });

    // Game events
    socket.on('make_move', async (data) => {
      try {
        console.log('📥 Server received move:', data);
        
        const game = await Game.findOne({ roomId: data.roomId });
        if (!game) {
          console.log('❌ Game not found:', data.roomId);
          socket.emit('error', { message: 'Game not found' });
          return;
        }
        
        console.log('♟️  Current FEN:', game.board || 'starting position');
        // Initialize chess.js instance with current FEN or starting position
        const chess = new Chess(game.board || undefined);
        
        // Validate move
        try {
          console.log('🔍 Attempting move:', data.from, '->', data.to);
          const move = chess.move({
            from: data.from,
            to: data.to,
            promotion: data.promotion || 'q'
          });
          
          if (!move) {
            console.log('❌ Invalid move rejected by chess.js');
            socket.emit('invalid_move', { message: 'Invalid move' });
            return;
          }
          
          console.log('✅ Valid move:', move.san);
          
          // Update game state
          game.board = chess.fen();
          game.currentPlayer = chess.turn() === 'w' ? 'white' : 'black';
          
          // Add move to history
          game.moves.push({
            from: data.from,
            to: data.to,
            piece: move.piece,
            captured: move.captured,
            notation: move.san,
            moveTime: data.moveTime || 0,
            timestamp: new Date()
          });
          
          // Check game status
          if (chess.isCheckmate()) {
            game.gameStatus = 'finished';
            game.result.winner = chess.turn() === 'w' ? 'black' : 'white';
            game.result.reason = 'checkmate';
            game.endedAt = new Date();
          } else if (chess.isDraw()) {
            game.gameStatus = 'finished';
            game.result.winner = 'draw';
            game.result.reason = chess.isStalemate() ? 'stalemate' : 'draw';
            game.endedAt = new Date();
          } else if (chess.isThreefoldRepetition()) {
            game.gameStatus = 'finished';
            game.result.winner = 'draw';
            game.result.reason = 'draw';
            game.endedAt = new Date();
          } else if (chess.isInsufficientMaterial()) {
            game.gameStatus = 'finished';
            game.result.winner = 'draw';
            game.result.reason = 'draw';
            game.endedAt = new Date();
          }
          
          await game.save();
          
          console.log('📤 Broadcasting move to room:', data.roomId);
          console.log('📤 New FEN:', chess.fen());
          // Broadcast move to all players in room
          io.to(data.roomId).emit('move_made', {
            move: {
              from: data.from,
              to: data.to,
              piece: move.piece,
              captured: move.captured,
              promotion: move.promotion,
              notation: move.san
            },
            fen: chess.fen(),
            currentPlayer: game.currentPlayer,
            isCheck: chess.isCheck(),
            isCheckmate: chess.isCheckmate(),
            isDraw: chess.isDraw(),
            gameStatus: game.gameStatus
          });
          
          // If game ended, emit game_ended event
          if (game.gameStatus === 'finished') {
            io.to(data.roomId).emit('game_ended', {
              winner: game.result.winner,
              reason: game.result.reason,
              game: game
            });
          }
          
        } catch (error) {
          console.error('Invalid move:', error);
          socket.emit('invalid_move', { message: 'Invalid move' });
        }
        
      } catch (error) {
        console.error('❌ Error making move:', error);
        console.error('❌ Error details:', error.message, error.stack);
        socket.emit('error', { message: 'Failed to make move: ' + error.message });
      }
    });

    socket.on('ready', async (data) => {
      try {
        console.log('Player ready:', data);
        
        const game = await Game.findOne({ roomId: data.roomId });
        if (!game) {
          socket.emit('error', { message: 'Game not found' });
          return;
        }
        
        // Determine which player is ready
        const isGuest = !socket.userId && socket.guestId;
        const userId = isGuest ? null : socket.userId;
        const guestId = isGuest ? socket.guestId : null;
        
        const isWhite = (userId && game.players.white?.userId?.toString() === userId) || 
                       (guestId && game.players.white?.guestId === guestId);
        const isBlack = (userId && game.players.black?.userId?.toString() === userId) || 
                       (guestId && game.players.black?.guestId === guestId);
        
        if (isWhite) {
          game.players.white.isReady = true;
        } else if (isBlack) {
          game.players.black.isReady = true;
        }
        
        await game.save();
        
        // Check if both players are ready
        const bothReady = game.players.white?.isReady && game.players.black?.isReady;
        
        if (bothReady && game.gameStatus === 'waiting') {
          // Initialize chess board with starting position
          const chess = new Chess();
          game.board = chess.fen();
          game.gameStatus = 'active';
          game.startedAt = new Date();
          await game.save();
          
          // Emit game started to both players
          io.to(data.roomId).emit('game_started', {
            fen: chess.fen(),
            game: game
          });
        } else {
          // Broadcast ready status to all players
          io.to(data.roomId).emit('player_ready', {
            playerColor: isWhite ? 'white' : 'black',
            game: game
          });
        }
        
      } catch (error) {
        console.error('Error handling player ready:', error);
        socket.emit('error', { message: 'Failed to set ready status' });
      }
    });

    socket.on('chat_message', async (data) => {
      // Handle chat messages
      console.log('Chat message:', data);
    });

    // Handle resignation
    socket.on('resign', async (data) => {
      try {
        console.log('🏳️ Player resigned:', data);
        const game = await Game.findOne({ roomId: data.roomId });
        
        if (!game) {
          socket.emit('error', { message: 'Game not found' });
          return;
        }

        // Determine who resigned
        const resignedPlayer = game.players.white?.socketId === socket.id ? 'white' : 'black';
        const winner = resignedPlayer === 'white' ? 'black' : 'white';

        game.gameStatus = 'finished';
        game.result = {
          winner: winner,
          reason: 'resignation',
          endedAt: new Date()
        };
        
        await game.save();

        // Emit game ended to both players
        io.to(data.roomId).emit('game_ended', {
          winner: winner,
          reason: 'resignation',
          result: game.result,
          game: game
        });

        // Broadcast lobby update
        io.emit('lobby_update', {
          action: 'game_ended',
          game: game
        });

        console.log('✅ Game ended by resignation');
      } catch (error) {
        console.error('❌ Error handling resignation:', error);
        socket.emit('error', { message: 'Failed to process resignation' });
      }
    });

    // Handle draw offer
    socket.on('offer_draw', async (data) => {
      try {
        console.log('🤝 Draw offered:', data);
        const game = await Game.findOne({ roomId: data.roomId });
        
        if (!game) {
          socket.emit('error', { message: 'Game not found' });
          return;
        }

        // Determine who offered
        const offeringPlayer = game.players.white?.socketId === socket.id ? 'white' : 'black';

        game.drawOffer = {
          from: offeringPlayer,
          timestamp: new Date()
        };
        
        await game.save();

        // Notify both players
        io.to(data.roomId).emit('draw_offered', {
          from: offeringPlayer,
          game: game
        });

        console.log('✅ Draw offer sent');
      } catch (error) {
        console.error('❌ Error handling draw offer:', error);
        socket.emit('error', { message: 'Failed to offer draw' });
      }
    });

    // Handle draw response
    socket.on('respond_draw', async (data) => {
      try {
        console.log('🤝 Draw response:', data);
        const game = await Game.findOne({ roomId: data.roomId });
        
        if (!game || !game.drawOffer) {
          socket.emit('error', { message: 'No active draw offer' });
          return;
        }

        if (data.accept) {
          // Draw accepted
          game.gameStatus = 'finished';
          game.result = {
            winner: 'draw',
            reason: 'draw_agreed',
            endedAt: new Date()
          };
          game.drawOffer = null;
          
          await game.save();

          // Emit game ended to both players
          io.to(data.roomId).emit('game_ended', {
            winner: 'draw',
            reason: 'draw_agreed',
            result: game.result,
            game: game
          });

          // Broadcast lobby update
          io.emit('lobby_update', {
            action: 'game_ended',
            game: game
          });

          console.log('✅ Draw accepted, game ended');
        } else {
          // Draw declined
          game.drawOffer = null;
          await game.save();

          io.to(data.roomId).emit('draw_declined', {
            game: game
          });

          console.log('✅ Draw declined');
        }
      } catch (error) {
        console.error('❌ Error handling draw response:', error);
        socket.emit('error', { message: 'Failed to respond to draw' });
      }
    });

    // Handle kick player
    socket.on('kick_player', async (data) => {
      try {
        console.log('👢 Kick player:', data);
        const game = await Game.findOne({ roomId: data.roomId });
        
        if (!game) {
          socket.emit('error', { message: 'Game not found' });
          return;
        }

        // Check if the kicker is the host (white player)
        const isHost = game.players.white?.socketId === socket.id;
        if (!isHost) {
          socket.emit('error', { message: 'Only the host can kick players' });
          return;
        }

        const playerToKick = game.players[data.playerColor];
        if (!playerToKick) {
          socket.emit('error', { message: 'Player not found' });
          return;
        }

        const kickedUsername = playerToKick.username;
        const kickedSocketId = playerToKick.socketId;

        // Remove the player from the game
        if (data.playerColor === 'black') {
          game.players.black = {
            userId: null,
            username: null,
            isGuest: false,
            guestId: null,
            socketId: null,
            isReady: false
          };
        }

        // If game was active, end it
        if (game.gameStatus === 'active' || game.gameStatus === 'waiting') {
          game.gameStatus = 'finished';
          game.result = {
            winner: data.playerColor === 'white' ? 'black' : 'white',
            reason: 'abandoned',
            endedAt: new Date()
          };
        }
        
        await game.save();

        // Notify the kicked player
        if (kickedSocketId) {
          io.to(kickedSocketId).emit('kicked_from_room', {
            roomId: data.roomId,
            message: 'You have been removed from the room'
          });
        }

        // Notify all players in the room about the player leaving
        io.to(data.roomId).emit('player_left', {
          username: kickedUsername,
          color: data.playerColor,
          gameStatus: game.gameStatus,
          result: game.result,
          game: game
        });

        // Broadcast lobby update
        io.emit('lobby_update', {
          action: game.gameStatus === 'finished' ? 'game_ended' : 'player_left',
          game: game
        });

        console.log('✅ Player kicked:', kickedUsername);
      } catch (error) {
        console.error('❌ Error kicking player:', error);
        socket.emit('error', { message: 'Failed to kick player' });
      }
    });
  });

  server.once('error', (err) => {
    console.error(err);
    process.exit(1);
  });

  server.listen(port, () => {
    console.log(`> Ready on http://${hostname}:${port}`);
  });
});
