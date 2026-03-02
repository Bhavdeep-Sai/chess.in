// Socket.io route handler for Next.js
// This sets up the Socket.io server

import { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  // Socket.io is handled via the custom server
  // This route is just a placeholder
  return new Response('Socket.io is running', {
    status: 200,
    headers: {
      'Content-Type': 'text/plain',
    },
  });
}

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
