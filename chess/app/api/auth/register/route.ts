import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import User from '@/lib/models/User';
import { generateToken, isValidEmail, isValidUsername } from '@/lib/utils/helpers';

export async function POST(request: NextRequest) {
  try {
    await dbConnect();
    
    const body = await request.json();
    const { username, email, password, profile } = body;

    // Validation
    if (!username || !email || !password) {
      return NextResponse.json(
        { error: 'Username, email, and password are required' },
        { status: 400 }
      );
    }

    if (!isValidEmail(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    if (!isValidUsername(username)) {
      return NextResponse.json(
        { error: 'Username must be 3-20 characters and contain only letters, numbers, and underscores' },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters long' },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [{ email }, { username }]
    });

    if (existingUser) {
      return NextResponse.json(
        { 
          error: existingUser.email === email ? 'Email already registered' : 'Username already taken'
        },
        { status: 400 }
      );
    }

    // Create new user
    const user = new User({
      username,
      email,
      password,
      profile: profile || {}
    });

    await user.save();

    // Generate token
    const token = generateToken(user._id.toString());

    return NextResponse.json({
      message: 'User registered successfully',
      token,
      user: user.getPublicProfile()
    }, { status: 201 });
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: 'Server error during registration' },
      { status: 500 }
    );
  }
}
