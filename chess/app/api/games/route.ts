import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Game from '@/lib/models/Game';
import { optionalAuth } from '@/lib/middleware/auth';

export async function GET(request: NextRequest) {
  try {
    await dbConnect();
    
    // Show all waiting games
    const games = await Game.find({
      gameStatus: 'waiting'
    })
      .populate('players.white.userId', 'username stats.rating')
      .populate('players.black.userId', 'username stats.rating')
      .populate('createdBy', 'username')
      .sort({ createdAt: -1 })
      .limit(20);

    const gameList = games.map(game => ({
      roomId: game.roomId,
      name: game.name || null,
      players: {
        white: game.players.white.userId ? {
          username: (game.players.white.userId as any).username,
          rating: (game.players.white.userId as any).stats.rating
        } : game.players.white.username ? {
          username: game.players.white.username,
          rating: 1200,
          isGuest: true
        } : null,
        black: game.players.black.userId ? {
          username: (game.players.black.userId as any).username,
          rating: (game.players.black.userId as any).stats.rating
        } : game.players.black.username ? {
          username: game.players.black.username,
          rating: 1200,
          isGuest: true
        } : null
      },
      timeControl: game.timeControl,
      settings: {
        hasPassword: !!game.settings.password,
        isPrivate: game.settings.isPrivate
      },
      isPrivate: game.settings.isPrivate,
      createdBy: (game.createdBy as any)?.username,
      creator: (game.createdBy as any)?.username || game.players.white.username || 'Unknown',
      createdAt: game.createdAt,
      status: game.gameStatus
    }));

    return NextResponse.json({ games: gameList });
  } catch (error) {
    console.error('Get lobby error:', error);
    return NextResponse.json(
      { error: 'Server error fetching lobby' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await dbConnect();
    
    const authResult = await optionalAuth(request);
    const user = authResult.user;
    
    const body = await request.json();
    const { name, timeControl, settings, isGuest, guestUsername, guestId } = body;

    // Generate unique room ID
    const { generateRoomId } = await import('@/lib/utils/helpers');
    let roomId: string;
    let attempts = 0;
    do {
      roomId = generateRoomId();
      const existingGame = await Game.findOne({ roomId });
      if (!existingGame) break;
      attempts++;
    } while (attempts < 10);

    if (attempts >= 10) {
      return NextResponse.json(
        { error: 'Unable to generate unique room ID' },
        { status: 500 }
      );
    }

    const gameData: any = {
      roomId,
      name: name || null,
      timeControl: {
        initialTime: timeControl?.initialTime || 600000,
        increment: timeControl?.increment || 0,
        whiteTime: timeControl?.initialTime || 600000,
        blackTime: timeControl?.initialTime || 600000
      },
      settings: {
        isPrivate: settings?.isPrivate || false,
        password: (settings?.password && settings.password.trim()) ? settings.password.trim() : null,
        autoStart: settings?.autoStart || false
      }
    };

    if (user) {
      gameData.players = {
        white: {
          userId: user._id,
          username: user.username,
          isGuest: false
        },
        black: {
          userId: null,
          username: null,
          isGuest: false
        }
      };
      gameData.createdBy = user._id;
    } else if (isGuest && guestUsername) {
      const { generateGuestId } = await import('@/lib/utils/helpers');
      const finalGuestId = guestId || generateGuestId();
      gameData.players = {
        white: {
          userId: null,
          username: guestUsername,
          isGuest: true,
          guestId: finalGuestId
        },
        black: {
          userId: null,
          username: null,
          isGuest: false
        }
      };
    } else {
      return NextResponse.json(
        { error: 'Authentication required or guest username needed' },
        { status: 400 }
      );
    }

    const game = new Game(gameData);
    await game.save();

    return NextResponse.json({
      message: 'Game room created successfully',
      roomId: game.roomId,
      game: game.getGameState()
    }, { status: 201 });
  } catch (error) {
    console.error('Create game error:', error);
    return NextResponse.json(
      { error: 'Server error creating game' },
      { status: 500 }
    );
  }
}
