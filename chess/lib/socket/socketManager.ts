import { Server as NetServer } from 'http';
import { NextApiResponse } from 'next';
import { Server as SocketIOServer } from 'socket.io';

export type NextApiResponseServerIO = NextApiResponse & {
  socket: {
    server: NetServer & {
      io?: SocketIOServer;
    };
  };
};

// This will be initialized in the API route
let io: SocketIOServer | null = null;

export const getIO = () => io;

export const initSocketIO = (server: NetServer): SocketIOServer => {
  if (!io) {
    io = new SocketIOServer(server, {
      path: '/api/socket/io',
      addTrailingSlash: false,
      cors: {
        origin: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
        methods: ['GET', 'POST'],
        credentials: true
      }
    });

    console.log('✅ Socket.IO server initialized');

    // Set up socket handlers
    setupSocketHandlers(io);
  }

  return io;
};

function setupSocketHandlers(io: SocketIOServer) {
  io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);

    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id);
    });

    // Add more socket event handlers here
    // These will be similar to the backend socket handlers
  });
}
