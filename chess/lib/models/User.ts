import mongoose, { Schema, Model } from 'mongoose';
import bcrypt from 'bcryptjs';

export interface IUser extends mongoose.Document {
  username: string;
  email: string;
  password: string;
  avatar?: string;
  profile: {
    firstName?: string;
    lastName?: string;
    country?: string;
    bio?: string;
  };
  stats: {
    gamesPlayed: number;
    gamesWon: number;
    gamesLost: number;
    gamesDrawn: number;
    rating: number;
    highestRating: number;
  };
  preferences: {
    boardTheme: string;
    pieceStyle: string;
    soundEnabled: boolean;
    autoQueen: boolean;
    showLegalMoves: boolean;
  };
  isOnline: boolean;
  lastSeen: Date;
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
  getPublicProfile(): object;
}

const userSchema = new Schema<IUser>(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      minlength: 3,
      maxlength: 20,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    password: {
      type: String,
      required: true,
      minlength: 6,
    },
    avatar: {
      type: String,
      default: null,
    },
    profile: {
      firstName: String,
      lastName: String,
      country: String,
      bio: String,
    },
    stats: {
      gamesPlayed: {
        type: Number,
        default: 0,
      },
      gamesWon: {
        type: Number,
        default: 0,
      },
      gamesLost: {
        type: Number,
        default: 0,
      },
      gamesDrawn: {
        type: Number,
        default: 0,
      },
      rating: {
        type: Number,
        default: 1200,
      },
      highestRating: {
        type: Number,
        default: 1200,
      },
    },
    preferences: {
      boardTheme: {
        type: String,
        default: 'classic',
      },
      pieceStyle: {
        type: String,
        default: 'standard',
      },
      soundEnabled: {
        type: Boolean,
        default: true,
      },
      autoQueen: {
        type: Boolean,
        default: false,
      },
      showLegalMoves: {
        type: Boolean,
        default: true,
      },
    },
    isOnline: {
      type: Boolean,
      default: false,
    },
    lastSeen: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

// Hash password before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    return next();
  }

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error: any) {
    next(error);
  }
});

// Compare password method
userSchema.methods.comparePassword = async function (candidatePassword: string): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password);
};

// Get public profile method
userSchema.methods.getPublicProfile = function () {
  return {
    id: this._id,
    username: this.username,
    email: this.email,
    avatar: this.avatar,
    profile: this.profile,
    stats: this.stats,
    preferences: this.preferences,
    isOnline: this.isOnline,
    lastSeen: this.lastSeen,
    createdAt: this.createdAt,
  };
};

const User: Model<IUser> = mongoose.models.User || mongoose.model<IUser>('User', userSchema);

export default User;
