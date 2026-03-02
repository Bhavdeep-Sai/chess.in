import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IPlayer {
  userId: mongoose.Types.ObjectId | null;
  username: string | null;
  isGuest: boolean;
  guestId: string | null;
  socketId: string | null;
  isReady: boolean;
}

export interface ICastlingRights {
  kingside: boolean;
  queenside: boolean;
}

export interface IResult {
  winner: 'white' | 'black' | 'draw' | null;
  reason: 'checkmate' | 'resignation' | 'timeout' | 'draw' | 'stalemate' | 'draw_agreed' | 'abandoned' | null;
}

export interface IMove {
  from: { row: number; col: number };
  to: { row: number; col: number };
  piece: any;
  captured?: any;
  notation: string;
  moveTime: number;
  timestamp: Date;
}

export interface ITimeControl {
  initialTime: number;
  increment: number;
  whiteTime: number;
  blackTime: number;
}

export interface ISettings {
  isPrivate: boolean;
  password: string | null;
  autoStart: boolean;
}

export interface IChatMessage {
  userId?: mongoose.Types.ObjectId;
  username: string;
  message: string;
  timestamp: Date;
  isSystem: boolean;
}

export interface IDrawOffer {
  from: 'white' | 'black' | null;
  timestamp: Date | null;
}

export interface IGame extends Document {
  roomId: string;
  name: string | null;
  players: {
    white: IPlayer;
    black: IPlayer;
  };
  board: string | null;  // FEN string representation
  currentPlayer: 'white' | 'black';
  gameStatus: 'waiting' | 'active' | 'paused' | 'finished';
  castlingRights: {
    white: ICastlingRights;
    black: ICastlingRights;
  };
  result: IResult;
  moves: IMove[];
  timeControl: ITimeControl;
  settings: ISettings;
  roomType: 'public' | 'private';
  chat: IChatMessage[];
  drawOffer: IDrawOffer;
  createdBy: mongoose.Types.ObjectId | null;
  startedAt?: Date;
  endedAt?: Date;
  createdAt: Date;
  updatedAt: Date;

  // Methods
  isSlotOccupied(color: 'white' | 'black'): boolean;
  isSlotEmpty(color: 'white' | 'black'): boolean;
  getPlayerIdentifier(color: 'white' | 'black'): string | null;
  isPlayerInGame(userId?: string | mongoose.Types.ObjectId, guestId?: string): boolean;
  getPlayerColor(userId?: string | mongoose.Types.ObjectId, guestId?: string): 'white' | 'black' | null;
  getGameState(): any;
  addMove(move: IMove): void;
  declareTimeout(losingColor: 'white' | 'black'): Promise<IGame>;
}

const gameSchema = new Schema<IGame>({
  roomId: {
    type: String,
    required: true,
    unique: true
  },
  name: {
    type: String,
    default: null,
    maxlength: 100
  },
  players: {
    white: {
      userId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        default: null
      },
      username: {
        type: String,
        default: null
      },
      isGuest: {
        type: Boolean,
        default: false
      },
      guestId: {
        type: String,
        default: null
      },
      socketId: {
        type: String,
        default: null
      },
      isReady: {
        type: Boolean,
        default: false
      }
    },
    black: {
      userId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        default: null
      },
      username: {
        type: String,
        default: null
      },
      isGuest: {
        type: Boolean,
        default: false
      },
      guestId: {
        type: String,
        default: null
      },
      socketId: {
        type: String,
        default: null
      },
      isReady: {
        type: Boolean,
        default: false
      }
    }
  },
  board: {
    type: String,
    default: null
  },
  currentPlayer: {
    type: String,
    enum: ['white', 'black'],
    default: 'white'
  },
  gameStatus: {
    type: String,
    enum: ['waiting', 'active', 'paused', 'finished'],
    default: 'waiting'
  },
  castlingRights: {
    white: {
      kingside: {
        type: Boolean,
        default: true
      },
      queenside: {
        type: Boolean,
        default: true
      }
    },
    black: {
      kingside: {
        type: Boolean,
        default: true
      },
      queenside: {
        type: Boolean,
        default: true
      }
    }
  },
  result: {
    winner: {
      type: String,
      enum: ['white', 'black', 'draw'],
      default: null
    },
    reason: {
      type: String,
      enum: ['checkmate', 'resignation', 'timeout', 'draw', 'stalemate', 'draw_agreed', 'abandoned'],
      default: null
    }
  },
  moves: [{
    from: {
      row: Number,
      col: Number
    },
    to: {
      row: Number,
      col: Number
    },
    piece: Schema.Types.Mixed,
    captured: Schema.Types.Mixed,
    notation: String,
    moveTime: {
      type: Number,
      default: 0
    },
    timestamp: {
      type: Date,
      default: Date.now
    }
  }],
  timeControl: {
    initialTime: {
      type: Number,
      default: 600000
    },
    increment: {
      type: Number,
      default: 0
    },
    whiteTime: Number,
    blackTime: Number
  },
  settings: {
    isPrivate: {
      type: Boolean,
      default: false
    },
    password: {
      type: String,
      default: null,
      maxlength: 50
    },
    autoStart: {
      type: Boolean,
      default: false
    }
  },
  roomType: {
    type: String,
    enum: ['public', 'private'],
    default: 'public'
  },
  chat: [{
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User'
    },
    username: String,
    message: String,
    timestamp: {
      type: Date,
      default: Date.now
    },
    isSystem: {
      type: Boolean,
      default: false
    }
  }],
  drawOffer: {
    from: {
      type: String,
      enum: ['white', 'black'],
      default: null
    },
    timestamp: {
      type: Date,
      default: null
    }
  },
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  startedAt: Date,
  endedAt: Date
}, {
  timestamps: true
});

// Indexes
gameSchema.index({ 'players.white.userId': 1 });
gameSchema.index({ 'players.black.userId': 1 });
gameSchema.index({ 'players.white.guestId': 1 });
gameSchema.index({ 'players.black.guestId': 1 });
gameSchema.index({ gameStatus: 1, 'settings.isPrivate': 1 });
gameSchema.index({ createdAt: -1 });

// Methods
gameSchema.methods.isSlotOccupied = function(color: 'white' | 'black'): boolean {
  const player = this.players[color];
  return !!(player.userId || player.guestId);
};

gameSchema.methods.isSlotEmpty = function(color: 'white' | 'black'): boolean {
  const player = this.players[color];
  return !player.userId && !player.guestId;
};

gameSchema.methods.getPlayerIdentifier = function(color: 'white' | 'black'): string | null {
  const player = this.players[color];
  if (player.userId) {
    return `user:${player.userId._id ? player.userId._id.toString() : player.userId.toString()}`;
  }
  if (player.guestId) {
    return `guest:${player.guestId}`;
  }
  return null;
};

gameSchema.methods.isPlayerInGame = function(userId?: string | mongoose.Types.ObjectId, guestId?: string): boolean {
  if (userId) {
    const userIdStr = userId.toString();
    const whiteUserId = this.players.white.userId?._id ? 
      this.players.white.userId._id.toString() : 
      this.players.white.userId?.toString();
    const blackUserId = this.players.black.userId?._id ? 
      this.players.black.userId._id.toString() : 
      this.players.black.userId?.toString();
    
    return (whiteUserId === userIdStr) || (blackUserId === userIdStr);
  }
  
  if (guestId) {
    return (this.players.white.guestId === guestId) || (this.players.black.guestId === guestId);
  }
  
  return false;
};

gameSchema.methods.getPlayerColor = function(userId?: string | mongoose.Types.ObjectId, guestId?: string): 'white' | 'black' | null {
  if (userId) {
    const userIdStr = userId.toString();
    const whiteUserId = this.players.white.userId?._id ? 
      this.players.white.userId._id.toString() : 
      this.players.white.userId?.toString();
    const blackUserId = this.players.black.userId?._id ? 
      this.players.black.userId._id.toString() : 
      this.players.black.userId?.toString();

    if (whiteUserId === userIdStr) return 'white';
    if (blackUserId === userIdStr) return 'black';
  }
  
  if (guestId) {
    if (this.players.white.guestId === guestId) return 'white';
    if (this.players.black.guestId === guestId) return 'black';
  }
  
  return null;
};

gameSchema.methods.getGameState = function() {
  return {
    roomId: this.roomId,
    players: this.players,
    board: this.board,
    currentPlayer: this.currentPlayer,
    gameStatus: this.gameStatus,
    result: this.result,
    moves: this.moves,
    timeControl: this.timeControl,
    settings: {
      isPrivate: this.settings.isPrivate,
      hasPassword: !!this.settings.password,
      autoStart: this.settings.autoStart
    },
    moveCount: this.moves.length,
    castlingRights: this.castlingRights
  };
};

gameSchema.methods.addMove = function(move: IMove) {
  this.moves.push(move);
  this.currentPlayer = this.currentPlayer === 'white' ? 'black' : 'white';
};

gameSchema.methods.declareTimeout = function(losingColor: 'white' | 'black'): Promise<IGame> {
  this.gameStatus = 'finished';
  this.result.winner = losingColor === 'white' ? 'black' : 'white';
  this.result.reason = 'timeout';
  return this.save();
};

// Pre-save validation
gameSchema.pre('save', function(next) {
  const whiteId = this.getPlayerIdentifier('white');
  const blackId = this.getPlayerIdentifier('black');
  
  if (whiteId && blackId && whiteId === blackId) {
    return next(new Error('Same user cannot be in both player slots'));
  }
  
  if (this.settings.password && !this.settings.isPrivate) {
    this.settings.isPrivate = true;
  }
  
  if (this.players.white.userId && this.players.white.guestId) {
    return next(new Error('Player cannot have both userId and guestId'));
  }
  if (this.players.black.userId && this.players.black.guestId) {
    return next(new Error('Player cannot have both userId and guestId'));
  }
  
  if (this.players.white.userId) {
    this.players.white.isGuest = false;
    this.players.white.guestId = null;
  } else if (this.players.white.guestId) {
    this.players.white.isGuest = true;
    this.players.white.userId = null;
  }
  
  if (this.players.black.userId) {
    this.players.black.isGuest = false;
    this.players.black.guestId = null;
  } else if (this.players.black.guestId) {
    this.players.black.isGuest = true;
    this.players.black.userId = null;
  }
  
  next();
});

const Game: Model<IGame> = mongoose.models.Game || mongoose.model<IGame>('Game', gameSchema);

export default Game;
