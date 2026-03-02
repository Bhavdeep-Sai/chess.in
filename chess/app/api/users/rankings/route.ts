import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/lib/models/User';

export async function GET() {
  try {
    await connectDB();
    
    // Get top 10 players by rating
    const rankings = await User.find({ 'stats.rating': { $exists: true } })
      .sort({ 'stats.rating': -1 })
      .limit(10)
      .select('username stats')
      .lean();

    return NextResponse.json({ 
      rankings: rankings || [],
      success: true 
    });
  } catch (error) {
    console.error('Error fetching rankings:', error);
    return NextResponse.json({ 
      rankings: [],
      success: false,
      error: 'Failed to fetch rankings' 
    }, { status: 500 });
  }
}
