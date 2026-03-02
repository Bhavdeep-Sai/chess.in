import { io, Socket } from 'socket.io-client';
import { getStoredToken } from './api';

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3000';

class SocketService {
  private socket: Socket | null = null;
  private isConnected: boolean = false;
  private eventListeners: Map<string, Function[]> = new Map();
  private currentRoom: string | null = null;

  connect(auth: any = {}) {
    if (this.socket?.connected) {
      return this.socket;
    }

    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }

    const token = getStoredToken();
    
    this.socket = io(SOCKET_URL, {
      auth: {
        token,
        ...auth
      },
      transports: ['websocket', 'polling'],
      forceNew: true,
    });

    this.socket.on('connect', () => {
      this.isConnected = true;
    });

    this.socket.on('disconnect', (reason) => {
      this.isConnected = false;
    });

    this.socket.on('error', (error) => {
      // Handle different error formats from the server
      if (error && typeof error === 'object') {
        console.error('Socket error:', error.message || JSON.stringify(error));
      } else {
        console.error('Socket error:', error);
      }
    });

    this.socket.on('connect_error', (error) => {
      console.error('Connection error:', {
        message: error.message,
        description: error.description,
        type: error.type,
        data: error.data
      });
    });

    return this.socket;
  }

  connectAsGuest(guestId: string, guestUsername: string) {
    return this.connect({
      guestId,
      guestUsername
    });
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
      this.eventListeners.clear();
      this.currentRoom = null;
    }
  }

  getIsConnected() {
    return this.isConnected && this.socket?.connected;
  }

  getSocket() {
    return this.socket;
  }

  on(event: string, callback: Function) {
    if (!this.socket) {
      console.warn('Socket not connected');
      return;
    }

    this.socket.on(event, callback as any);
    
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    this.eventListeners.get(event)!.push(callback);
  }

  off(event: string, callback?: Function) {
    if (!this.socket) return;

    if (callback) {
      this.socket.off(event, callback as any);
    } else {
      this.socket.off(event);
    }
    
    if (callback && this.eventListeners.has(event)) {
      const listeners = this.eventListeners.get(event)!;
      const index = listeners.indexOf(callback);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }

  emit(event: string, data?: any) {
    if (!this.socket) {
      console.warn('Socket not connected');
      return;
    }

    this.socket.emit(event, data);
  }

  joinRoom(roomId: string, password?: string) {
    this.currentRoom = roomId;
    this.emit('join_room', { roomId, password });
  }

  leaveRoom(roomId: string) {
    this.emit('leave_room', { roomId });
    this.currentRoom = null;
  }

  clearCurrentRoom() {
    this.currentRoom = null;
  }

  isSocketConnected() {
    return this.isConnected;
  }

  // Game-specific methods
  makeMove(roomId: string, from: any, to: any, moveStartTime?: number) {
    // Support both {row, col} and string formats
    let fromSquare, toSquare;
    
    if (typeof from === 'string' && typeof to === 'string') {
      fromSquare = from;
      toSquare = to;
      console.log('📡 Socket: Sending move (string format):', fromSquare, '->', toSquare);
    } else {
      // Convert {row, col} to algebraic notation
      fromSquare = this.positionToSquare(from);
      toSquare = this.positionToSquare(to);
      console.log('📡 Socket: Sending move (converted from pos):', fromSquare, '->', toSquare);
    }
    
    this.emit('make_move', { roomId, from: fromSquare, to: toSquare, moveStartTime });
    console.log('📡 Socket: Move emitted to server');
  }

  private positionToSquare(pos: { row: number; col: number }): string {
    const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
    return files[pos.col] + (8 - pos.row);
  }

  playerReady(roomId: string) {
    this.emit('ready', { roomId });
  }

  resign(roomId: string) {
    this.emit('resign', { roomId });
  }

  sendChatMessage(roomId: string, message: string) {
    this.emit('chat_message', { roomId, message });
  }

  offerDraw(roomId: string) {
    this.emit('offer_draw', { roomId });
  }

  acceptDraw(roomId: string) {
    this.emit('accept_draw', { roomId });
  }

  declineDraw(roomId: string) {
    this.emit('decline_draw', { roomId });
  }

  declareTimeout(roomId: string, losingColor: 'white' | 'black') {
    this.emit('declare_timeout', { roomId, losingColor });
  }
}

const socketService = new SocketService();

export default socketService;
