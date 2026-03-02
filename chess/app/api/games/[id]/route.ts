import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Game from '@/lib/models/Game';
import { optionalAuth } from '@/lib/middleware/auth';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();
    
    const { id: roomId } = await params;
    const { searchParams } = new URL(request.url);
    const guestId = searchParams.get('guestId');
    
    const authResult = await optionalAuth(request);
    const user = authResult.user;

    const game = await Game.findOne({ roomId });

    if (!game) {
      return NextResponse.json(
        { error: 'Game not found' },
        { status: 404 }
      );
    }

    // Determine player color
    let playerColor = null;
    if (user) {
      playerColor = game.getPlayerColor(user._id.toString());
    } else if (guestId) {
      playerColor = game.getPlayerColor(undefined, guestId);
    }

    return NextResponse.json({
      game: game.getGameState(),
      playerColor
    });
  } catch (error) {
    console.error('Get game error:', error);
    return NextResponse.json(
      { error: 'Server error fetching game' },
      { status: 500 }
    );
  }
}
