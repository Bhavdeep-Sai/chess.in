import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import User from '@/lib/models/User';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();
    
    const { id: username } = await params;
    
    const user = await User.findOne({ username })
      .select('username stats profile createdAt')
      .lean();

    if (!user) {
      return NextResponse.json(
        { message: 'User not found' },
        { status: 404 }
      );
    }

    const rank = await User.countDocuments({ 
      'stats.rating': { $gt: user.stats?.rating || 1200 } 
    }) + 1;

    return NextResponse.json({
      username: user.username,
      stats: user.stats,
      profile: user.profile,
      createdAt: user.createdAt,
      rank
    });
  } catch (error) {
    console.error('Get profile error:', error);
    return NextResponse.json(
      { message: 'Server error' },
      { status: 500 }
    );
  }
}
