import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import User from '@/lib/models/User';

export async function GET(request: NextRequest) {
  try {
    await dbConnect();
    
    // Get top 50 players by rating
    const topPlayers = await User.find()
      .select('username stats.rating stats.gamesPlayed stats.gamesWon stats.gamesLost stats.gamesDrawn')
      .sort({ 'stats.rating': -1 })
      .limit(50)
      .lean();

    const rankings = topPlayers.map(player => ({
      _id: player._id,
      username: player.username,
      stats: {
        rating: player.stats?.rating || 1200,
        gamesPlayed: player.stats?.gamesPlayed || 0,
        gamesWon: player.stats?.gamesWon || 0,
        gamesLost: player.stats?.gamesLost || 0,
        gamesDrawn: player.stats?.gamesDrawn || 0
      }
    }));

    return NextResponse.json({ rankings });
  } catch (error) {
    console.error('Get rankings error:', error);
    return NextResponse.json(
      { message: 'Server error' },
      { status: 500 }
    );
  }
}
