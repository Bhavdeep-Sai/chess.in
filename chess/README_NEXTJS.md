# Next.js Chess Application - Complete Infrastructure

## Overview

This Next.js application provides a complete chess platform with:
- **User Authentication** (JWT-based with MongoDB)
- **Real-time Multiplayer** (Socket.io integration)
- **Guest Play** (No registration required)
- **Game Lobby** (Create and join games)
- **Dark/Light Theme** Support

## Project Structure

```
chess/
├── app/
│   ├── api/              # API routes (Next.js App Router)
│   │   ├── auth/         # Authentication endpoints
│   │   ├── games/        # Game management endpoints
│   │   └── users/        # User endpoints
│   ├── components/       # React client components
│   │   └── auth/         # Auth-related components
│   ├── contexts/         # React contexts (Auth, Theme)
│   ├── hooks/            # Custom React hooks
│   ├── services/         # API and Socket services
│   └── utils/            # Utility functions
├── lib/
│   ├── middleware/       # Server middleware (auth)
│   ├── models/           # MongoDB models
│   ├── socket/           # Socket.io setup
│   └── utils/            # Server utilities
├── public/               # Static assets
└── server.js             # Custom Next.js server with Socket.io
```

## Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment Variables

Create a `.env.local` file in the chess directory:

```env
MONGODB_URI=mongodb://localhost:27017/chess-game
JWT_SECRET=your-super-secret-jwt-key-change-this
JWT_EXPIRES_IN=7d
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_API_URL=http://localhost:3000/api
NEXT_PUBLIC_SOCKET_URL=http://localhost:3000
PORT=3000
NODE_ENV=development
```

### 3. Start MongoDB

Ensure MongoDB is running on your system:

```bash
mongod
```

### 4. Run Development Server

```bash
npm run dev
```

The application will be available at `http://localhost:3000`

## Key Features Implemented

### Backend (API Routes)

1. **Authentication** (`app/api/auth/`)
   - `/api/auth/register` - User registration
   - `/api/auth/login` - User login
   - `/api/auth/me` - Get/update profile

2. **Games** (`app/api/games/`)
   - `/api/games` - List games, create game
   - `/api/games/[id]` - Get specific game

3. **Users** (`app/api/users/`)
   - `/api/users` - Get rankings
   - `/api/users/[id]` - Get user profile

### Frontend (Components)

- **WelcomePage** - Landing page
- **GameLobby** - Browse and create games
- **LoginForm** - User authentication
- **RegisterForm** - New user registration
- **ThemeToggle** - Dark/light mode switcher

### Real-time Features

- **Socket.io Server** - Custom Next.js server in `server.js`
- **Socket Service** - Client-side socket management
- **Real-time Updates** - Game state, chat, moves

### Database Models

- **User Model** - User accounts with stats
- **Game Model** - Game rooms and state

## Architecture Notes

### Next.js App Router

This application uses Next.js 14+ App Router with:
- Server Components by default
- Client Components marked with `'use client'`
- API Routes using route handlers

### TypeScript

All files use TypeScript for type safety:
- Proper interfaces for props and state
- Type-safe API calls
- Mongoose schema types

### Authentication Flow

1. User registers/logs in
2. JWT token stored in localStorage
3. Token sent with API requests via Axios interceptor
4. Server validates token in middleware

### Socket.io Integration

The custom server (`server.js`) runs both:
- Next.js application
- Socket.io server on the same port

This allows seamless real-time communication without CORS issues.

## Development Notes

### Component Conversion Strategy

All React components from `frontend/src/components/*.jsx` need to be converted to:
- TypeScript (`.tsx`)
- Client Components (`'use client'` directive)
- Proper type definitions for props

### Remaining Work

The following components still need to be created:
- ChessBoard, GameBoard, Square components
- MultiplayerChessBoard (main game component)
- RoomLobby, ChatBox, MoveHistory
- GameInfo, CapturedPieces, PromotionModal
- Results, ProfileManagement
- And other utility components

### Socket Event Handlers

The server.js has basic socket setup. Full game handlers from backend/socket/gameHandlers.js need to be integrated including:
- Room creation/joining
- Move validation and broadcasting
- Chat messages
- Game state updates
- Timer management

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user
- `PUT /api/auth/me` - Update profile

### Games
- `GET /api/games` - List available games
- `POST /api/games` - Create new game
- `GET /api/games/[id]` - Get game details

### Users
- `GET /api/users` - Get user rankings
- `GET /api/users/[id]` - Get user profile

## Technologies Used

- **Next.js 14+** - React framework with App Router
- **TypeScript** - Type-safe JavaScript
- **MongoDB** - Database via Mongoose
- **Socket.io** - Real-time communication
- **JWT** - Authentication tokens
- **Tailwind CSS** - Styling
- **React Hot Toast** - Notifications
- **Axios** - HTTP client
- **bcryptjs** - Password hashing

## Production Deployment

For production deployment:

1. Update environment variables for production MongoDB and URLs
2. Build the application: `npm run build`
3. Start production server: `npm start`
4. Ensure MongoDB is accessible from production server
5. Configure proper JWT secrets and secure credentials

## Testing

To test the application:

1. Start the development server
2. Navigate to `http://localhost:3000`
3. Click "Get Started" on welcome page
4. Register a new account or play as guest
5. Create a game in the lobby
6. Test real-time features by opening multiple browser windows

## Support

For issues or questions about the conversion:
- Check MongoDB connection
- Verify environment variables
- Check browser console for errors
- Review server logs for API errors
