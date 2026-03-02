# ♟️ Chess - Real-Time Multiplayer Chess Platform

A modern, full-stack multiplayer chess application built with Next.js 14+, TypeScript, Socket.io, and MongoDB. Play chess in real-time with friends or challenge random opponents worldwide.

![Chess Application](public/Logo.png)

## ✨ Features

### 🎮 Multiplayer Gameplay
- **Real-time multiplayer** with Socket.io WebSocket connections
- **Guest mode** - Play without registration
- **Private & public rooms** - Create custom games or join public matches
- **Live move synchronization** - Instant updates across all connected clients
- **Real-time chat** - Communicate with your opponent during games

### ♟️ Complete Chess Implementation
- **Full chess rules** - All legal moves, captures, and special moves
- **En passant, castling, pawn promotion** - Complete chess ruleset
- **Check, checkmate, stalemate detection** - Automatic game state validation
- **Move history** - Track all moves in standard chess notation
- **Captured pieces display** - Visual material advantage tracker
- **Move validation** - Server-side validation prevents illegal moves

### 👤 User Management
- **JWT authentication** - Secure token-based auth
- **User profiles** - Track personal stats and games
- **ELO rating system** - Competitive ranking with rating calculations
- **Global leaderboards** - View top-ranked players
- **Game history** - Review past games and results

### 🎨 Modern UI/UX
- **Responsive design** - Works on desktop, tablet, and mobile
- **Theme system** - Light, dark, and auto modes
- **Smooth animations** - Framer Motion for fluid transitions
- **Toast notifications** - Real-time feedback for user actions
- **Error boundaries** - Graceful error handling
- **Loading states** - Enhanced UX with loading indicators

## 🛠️ Tech Stack

### Frontend
- **Next.js 16** - React framework with App Router
- **TypeScript** - Type-safe development
- **Tailwind CSS 4** - Utility-first styling
- **Framer Motion** - Animation library
- **React Icons** - Modern icon library
- **React Hot Toast** - Notification system
- **React Chessboard** - Chess UI component

### Backend
- **Next.js API Routes** - Serverless API endpoints
- **Custom Node.js Server** - Socket.io integration
- **Socket.io 4** - Real-time bidirectional communication
- **MongoDB** - NoSQL database with Mongoose ODM
- **JWT** - JSON Web Token authentication
- **BCrypt.js** - Password hashing

### Game Engine
- **Chess.js** - Chess logic and move validation
- **Custom game state management** - Room and player handling
- **ELO rating calculation** - Mathematical rating system

## 📋 Prerequisites

- **Node.js** 18+ or 20+
- **npm** or **yarn** or **pnpm**
- **MongoDB** instance (local or cloud like MongoDB Atlas)
- **Git** (for cloning the repository)

## 🚀 Getting Started

### 1. Clone the Repository

```bash
git clone <repository-url>
cd chess
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Environment Configuration

Create a `.env.local` file in the root directory:

```env
# MongoDB Connection
MONGODB_URI=mongodb://localhost:27017/chess
# Or for MongoDB Atlas:
# MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/chess?retryWrites=true&w=majority

# JWT Secret (generate a random secure string)
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production

# Next.js Configuration
NEXT_PUBLIC_API_URL=http://localhost:3000
NEXT_PUBLIC_SOCKET_URL=http://localhost:3000

# Node Environment
NODE_ENV=development
```

### 4. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the application.

### 5. Build for Production

```bash
npm run build
npm start
```

## 📁 Project Structure

```
chess/
├── app/                          # Next.js App Router
│   ├── api/                      # API Routes
│   │   ├── auth/                 # Authentication endpoints
│   │   ├── games/                # Game management
│   │   ├── users/                # User management
│   │   └── socket/               # Socket.io endpoint
│   ├── components/               # React components
│   │   ├── auth/                 # Login/Register forms
│   │   ├── AnimatedCounter.tsx
│   │   ├── ChatBox.tsx
│   │   ├── ChessBoard.tsx
│   │   ├── GameLobby.tsx
│   │   ├── MultiplayerChessBoard.tsx
│   │   └── ...
│   ├── contexts/                 # React Context providers
│   │   ├── AuthContext.tsx
│   │   └── ThemeContext.tsx
│   ├── game/[roomId]/            # Dynamic game routes
│   ├── hooks/                    # Custom React hooks
│   ├── services/                 # API and Socket services
│   ├── utils/                    # Utility functions
│   ├── layout.tsx                # Root layout
│   └── page.tsx                  # Home page
├── lib/                          # Backend logic
│   ├── middleware/               # Express-like middleware
│   ├── models/                   # Mongoose models
│   ├── socket/                   # Socket.io handlers
│   │   └── socketManager.ts
│   ├── utils/                    # Backend utilities
│   │   ├── chessLogic.ts         # Chess game engine
│   │   ├── roomManager.ts        # Room state management
│   │   └── helpers.ts            # JWT, ratings, etc.
│   └── mongodb.ts                # Database connection
├── public/                       # Static assets
│   └── assets/                   # Images and icons
├── server.js                     # Custom Next.js server
├── next.config.ts                # Next.js configuration
├── tailwind.config.ts            # Tailwind configuration
└── package.json                  # Dependencies
```

## 🔌 API Endpoints

### Authentication
- `POST /api/auth/register` - Create new user account
- `POST /api/auth/login` - Login and receive JWT token
- `GET /api/auth/me` - Get current user profile
- `PUT /api/auth/me` - Update user profile

### Users
- `GET /api/users` - Get all users (with pagination)
- `GET /api/users/[id]` - Get specific user profile
- `GET /api/users/rankings` - Get leaderboard rankings

### Games
- `GET /api/games` - List games (with filters)
- `POST /api/games` - Create new game
- `GET /api/games/[id]` - Get game details
- `PUT /api/games/[id]` - Update game state

### Socket.io Events
- `createRoom` - Create a new game room
- `joinRoom` - Join existing room
- `leaveRoom` - Leave current room
- `makeMove` - Send chess move
- `sendMessage` - Send chat message
- `offerDraw` - Propose draw
- `resign` - Resign from game

## 🎯 How to Play

1. **Register/Login** or play as guest
2. **Create Room** or join an existing one
3. **Choose room settings:**
   - Time control (Rapid, Blitz, Bullet)
   - Public or private
   - Wait for opponent
4. **Play chess!** Make moves by clicking pieces
5. **Chat** with your opponent during the game
6. **View results** and rating changes after game

## 🧪 Development

### Run Linter

```bash
npm run lint
```

### Code Structure Guidelines
- Components in `app/components/`
- Server logic in `lib/`
- API routes in `app/api/`
- Use TypeScript for type safety
- Follow React best practices

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License.

## 🙏 Acknowledgments

- [Chess.js](https://github.com/jhlywa/chess.js) - Chess engine
- [React Chessboard](https://github.com/Clariity/react-chessboard) - Chessboard component
- [Socket.io](https://socket.io/) - Real-time communication
- [Next.js](https://nextjs.org/) - React framework

## 📞 Support

For issues and questions, please open an issue on GitHub.

---

Built with ♟️ by passionate chess developers
