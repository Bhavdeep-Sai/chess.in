import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import { authenticateUser } from '@/lib/middleware/auth';

export async function GET(request: NextRequest) {
  try {
    await dbConnect();
    
    const authResult = await authenticateUser(request);
    if ('error' in authResult) {
      return NextResponse.json(
        { error: authResult.error },
        { status: authResult.status }
      );
    }

    const profile = authResult.user.getPublicProfile();
    // Include email for user's own profile
    profile.email = authResult.user.email;
    
    return NextResponse.json({ user: profile });
  } catch (error) {
    console.error('Get profile error:', error);
    return NextResponse.json(
      { error: 'Server error fetching profile' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    await dbConnect();
    
    const authResult = await authenticateUser(request);
    if ('error' in authResult) {
      return NextResponse.json(
        { error: authResult.error },
        { status: authResult.status }
      );
    }

    const body = await request.json();
    const { profile, avatar } = body;
    const user = authResult.user;

    if (profile) {
      user.profile = { ...user.profile, ...profile };
    }

    if (avatar) {
      user.avatar = avatar;
    }

    await user.save();

    return NextResponse.json({
      message: 'Profile updated successfully',
      user: user.getPublicProfile()
    });
  } catch (error) {
    console.error('Update profile error:', error);
    return NextResponse.json(
      { error: 'Server error updating profile' },
      { status: 500 }
    );
  }
}
