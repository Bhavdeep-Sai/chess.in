import { NextRequest } from 'next/server';
import jwt from 'jsonwebtoken';
import User from '../models/User';
import dbConnect from '../mongodb';

export interface AuthRequest extends NextRequest {
  user?: any;
}

export async function authenticateUser(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return { error: 'Access denied. No token provided.', status: 401 };
    }

    const token = authHeader.replace('Bearer ', '');
    
    if (!process.env.JWT_SECRET) {
      return { error: 'JWT_SECRET not configured', status: 500 };
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET) as { userId: string };
    
    await dbConnect();
    const user = await User.findById(decoded.userId).select('-password');
    
    if (!user) {
      return { error: 'Invalid token. User not found.', status: 401 };
    }

    return { user };
  } catch (error: any) {
    if (error.name === 'JsonWebTokenError') {
      return { error: 'Invalid token.', status: 401 };
    } else if (error.name === 'TokenExpiredError') {
      return { error: 'Token expired.', status: 401 };
    }
    return { error: 'Server error in authentication.', status: 500 };
  }
}

// Optional auth - doesn't fail if no token provided
export async function optionalAuth(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization');
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.replace('Bearer ', '');
      
      if (process.env.JWT_SECRET) {
        const decoded = jwt.verify(token, process.env.JWT_SECRET) as { userId: string };
        
        await dbConnect();
        const user = await User.findById(decoded.userId).select('-password');
        
        if (user) {
          return { user };
        }
      }
    }
    
    return { user: null };
  } catch (error) {
    // Don't fail, just continue without user
    return { user: null };
  }
}
