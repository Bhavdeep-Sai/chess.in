import React, { useState, useEffect, useCallback } from "react";
import { useAuth } from "../hooks/useAuth";
import { useTheme } from "../hooks/useTheme";
import { gamesApi } from "../services/api";
import ProfileManagement from "./ProfileManagement";
import chesslogo from "../assets/logo.png";
import showToast from "../utils/toast";

const GameLobby = ({
  onJoinGame,
  onCreateGame,
  onPlayPractice,
  onLogout,
  isGuest,
  guestData,
  socket,
}) => {
  // Core state
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [_error, setError] = useState(null);
  const [onlineUsers, setOnlineUsers] = useState(0);

  // UI state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showProfileManagement, setShowProfileManagement] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordRoomId, setPasswordRoomId] = useState("");

  // Search & Filter state
  const [searchTerm, setSearchTerm] = useState("");
  const [gameFilter, setGameFilter] = useState("all"); // all, waiting, active, private
  const [sortBy, setSortBy] = useState("newest");

  // Create game state
  const [createForm, setCreateForm] = useState({
    name: "",
    timeControl: "10+0",
    isPrivate: false,
    password: "",
    isRated: false,
  });

  // Join game state
  const [joinForm, setJoinForm] = useState({
    roomId: "",
    password: "",
  });

  // Loading states for actions
  const [quickPlayLoading, setQuickPlayLoading] = useState(false);

  const { user } = useAuth();
  const theme = useTheme();

  // Icon Components
  const Icons = {
    Chess: ({ size = 24, className = "" }) => (
      <svg
        className={className}
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        <path d="M8 2L16 2L14 8L10 8L8 2Z" />
        <path d="M6 8L18 8L16 20L8 20L6 8Z" />
        <circle cx="12" cy="12" r="2" />
      </svg>
    ),
    Lightning: ({ size = 24, className = "" }) => (
      <svg
        className={className}
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        <polygon points="13,2 3,14 12,14 11,22 21,10 12,10 13,2" />
      </svg>
    ),
    Globe: ({ size = 24, className = "" }) => (
      <svg
        className={className}
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        <circle cx="12" cy="12" r="10" />
        <line x1="2" y1="12" x2="22" y2="12" />
        <path d="m12,2a15.3,15.3 0 0 1 4,10 15.3,15.3 0 0 1 -4,10 15.3,15.3 0 0 1 -4,-10 15.3,15.3 0 0 1 4,-10z" />
      </svg>
    ),
    Lock: ({ size = 24, className = "" }) => (
      <svg
        className={className}
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
      </svg>
    ),
    Users: ({ size = 24, className = "" }) => (
      <svg
        className={className}
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
    Search: ({ size = 24, className = "" }) => (
      <svg
        className={className}
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        <circle cx="11" cy="11" r="8" />
        <path d="m21 21-4.35-4.35" />
      </svg>
    ),
    Filter: ({ size = 24, className = "" }) => (
      <svg
        className={className}
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        <polygon points="22,3 2,3 10,12.46 10,19 14,21 14,12.46 22,3" />
      </svg>
    ),
    Play: ({ size = 24, className = "" }) => (
      <svg
        className={className}
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        <polygon points="5,3 19,12 5,21 5,3" />
      </svg>
    ),
    Plus: ({ size = 24, className = "" }) => (
      <svg
        className={className}
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        <line x1="12" y1="5" x2="12" y2="19" />
        <line x1="5" y1="12" x2="19" y2="12" />
      </svg>
    ),
    Close: ({ size = 24, className = "" }) => (
      <svg
        className={className}
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        <line x1="18" y1="6" x2="6" y2="18" />
        <line x1="6" y1="6" x2="18" y2="18" />
      </svg>
    ),
    Refresh: ({ size = 24, className = "" }) => (
      <svg
        className={className}
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        <polyline points="23,4 23,10 17,10" />
        <polyline points="1,20 1,14 7,14" />
        <path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 0 1 3.51 15" />
      </svg>
    ),
    Target: ({ size = 24, className = "" }) => (
      <svg
        className={className}
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        <circle cx="12" cy="12" r="10" />
        <circle cx="12" cy="12" r="6" />
        <circle cx="12" cy="12" r="2" />
      </svg>
    ),
    Clock: ({ size = 24, className = "" }) => (
      <svg
        className={className}
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        <circle cx="12" cy="12" r="10" />
        <polyline points="12,6 12,12 16,14" />
      </svg>
    ),
    Settings: ({ size = 24, className = "" }) => (
      <svg
        className={className}
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        <circle cx="12" cy="12" r="3" />
        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1 1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
      </svg>
    ),
    LogOut: ({ size = 24, className = "" }) => (
      <svg
        className={className}
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
        <polyline points="16,17 21,12 16,7" />
        <line x1="21" y1="12" x2="9" y2="12" />
      </svg>
    ),
    RefreshCw: ({ size = 24, className = "" }) => (
      <svg
        className={className}
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        <polyline points="23,4 23,10 17,10" />
        <polyline points="1,20 1,14 7,14" />
        <path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 0 1 3.51 15" />
      </svg>
    ),
    User: ({ size = 24, className = "" }) => (
      <svg
        className={className}
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
        <circle cx="12" cy="7" r="4" />
      </svg>
    ),
  };

  // Load games from backend
  const loadGames = useCallback(async () => {
    try {
      setLoading(true);
      const response = await gamesApi.getLobby();
      setGames(response.data.games || []);
    } catch (err) { // eslint-disable-line no-unused-vars
      showToast.error("Failed to load games. Please try again.");
      setError("Failed to load games. Please try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  // Socket event handlers
  useEffect(() => {
    if (!socket) {
      return;
    }

    // Request initial user count when socket is available
    console.log('GameLobby: Requesting initial user count');
    socket.emit('request_user_count');

    // Listen for updates
    const handleGamesUpdated = (updatedGames) => {
      setGames(updatedGames);
    };

    const handleUserCount = (count) => {
      console.log('GameLobby: Received user count:', count);
      setOnlineUsers(count);
    };

    const handleGameCreated = (game) => {
      setGames((prev) => [game, ...prev]);
    };

    const handleGameJoined = (gameData) => {
      if (onJoinGame) {
        onJoinGame(gameData.roomId);
      }
    };

    const handleLobbyUpdate = (data) => {
      setGames(data.games || []);
    };

    const handleError = (error) => {
      showToast.error(error.message || "An error occurred");
      setError(error.message || "An error occurred");
    };

    socket.on("games_updated", handleGamesUpdated);
    socket.on("user_count", handleUserCount);
    socket.on("game_created", handleGameCreated);
    socket.on("game_joined", handleGameJoined);
    socket.on("lobby_update", handleLobbyUpdate);
    socket.on("error", handleError);

    return () => {
      socket.off("games_updated", handleGamesUpdated);
      socket.off("user_count", handleUserCount);
      socket.off("game_created", handleGameCreated);
      socket.off("game_joined", handleGameJoined);
      socket.off("lobby_update", handleLobbyUpdate);
      socket.off("error", handleError);
    };
  }, [socket, onJoinGame]);

  // Initial load
  useEffect(() => {
    loadGames();

    // Auto-refresh every 30 seconds
    const interval = setInterval(loadGames, 30000);
    return () => clearInterval(interval);
  }, [loadGames]);

  // Game handlers - REBUILT FOR SOCKET-ONLY FLOW
  const handleCreateGame = async () => {
    try {
      if (!socket || !socket.connected) {
        showToast.error("Not connected to server. Please refresh the page.");
        return;
      }

      // Parse time control
      const [minutes, increment] = createForm.timeControl.split("+").map(Number);
      const initialTime = minutes * 60 * 1000;
      const incrementTime = increment * 1000;

      // Set up one-time listeners for room creation response
      const handleRoomCreated = (data) => {
        console.log('✅ Room created:', data);
        socket.off('room_created', handleRoomCreated);
        socket.off('error', handleError);
        
        setShowCreateModal(false);
        setCreateForm({
          name: "",
          timeControl: "10+0",
          isPrivate: false,
          password: "",
          isRated: false,
        });

        // Navigate to game with the created room
        if (onCreateGame) {
          onCreateGame(data.roomId, createForm.password || null);
        }
      };

      const handleError = (error) => {
        console.error('❌ Room creation error:', error);
        socket.off('room_created', handleRoomCreated);
        socket.off('error', handleError);
        showToast.error(error.message || "Failed to create room");
        setError(error.message || "Failed to create room");
      };

      socket.once('room_created', handleRoomCreated);
      socket.once('error', handleError);

      // Create room via socket
      socket.emit('create_room', {
        name: createForm.name || null,
        timeControl: {
          initialTime,
          increment: incrementTime,
        },
        settings: {
          isPrivate: createForm.isPrivate,
          password: createForm.password || null,
          autoStart: false,
        },
        isGuest,
        guestUsername: isGuest ? guestData.username : undefined,
      });

      console.log('📤 Sent create_room event');

    } catch (err) {
      console.error('Create game error:', err);
      showToast.error("Failed to create game");
      setError("Failed to create game");
    }
  };

  const handleJoinGame = async (roomId, password = "") => {
    try {
      if (!roomId) return;

      if (!socket || !socket.connected) {
        showToast.error("Not connected to server. Please refresh the page.");
        return;
      }

      // Clear modals
      setJoinForm({ roomId: "", password: "" });
      setShowPasswordModal(false);
      setPasswordRoomId("");

      // Navigate to game - socket will handle joining
      if (onJoinGame) {
        onJoinGame(roomId, null, password);
      }

    } catch (err) {
      console.error('Join game error:', err);
      const errorMsg = err.message || "Failed to join game";
      showToast.error(errorMsg);
      setError(errorMsg);
    }
  };

  const handleJoinGameClick = (game) => {
    // Only show password modal if the game has a password OR is private with password
    if (game.settings?.hasPassword) {
      setPasswordRoomId(game.roomId);
      setShowPasswordModal(true);
    } else {
      // Join directly without password for public rooms or private rooms without password
      handleJoinGame(game.roomId);
    }
  };

  const handleJoinByRoomId = async () => {
    // When joining by room ID, navigate directly
    const roomId = joinForm.roomId.trim();
    if (!roomId) return;

    // Navigate to game - socket will handle joining and password validation
    if (onJoinGame) {
      onJoinGame(roomId, null, "");
    }
    
    setJoinForm({ roomId: "", password: "" });
  };

  const handleQuickPlay = async () => {
    // Prevent multiple clicks
    if (quickPlayLoading) {
      return;
    }

    try {
      setQuickPlayLoading(true);
      
      if (!socket || !socket.connected) {
        showToast.error("Not connected to server. Please refresh the page.");
        setQuickPlayLoading(false);
        return;
      }

      // Find a waiting game to join
      const waitingGame = games.find(
        (g) => g.status === "waiting" && !g.isPrivate && !g.settings?.hasPassword
      );

      if (waitingGame) {
        // Join existing game
        console.log('Joining existing waiting game:', waitingGame.roomId);
        await handleJoinGame(waitingGame.roomId);
      } else {
        // Create a new quick game via socket
        const [minutes, increment] = "10+0".split("+").map(Number);
        const initialTime = minutes * 60 * 1000;
        const incrementTime = increment * 1000;

        // Set up one-time listeners
        const handleRoomCreated = (data) => {
          console.log('✅ Quick game room created:', data);
          socket.off('room_created', handleRoomCreated);
          socket.off('error', handleError);
          
          if (onCreateGame) {
            onCreateGame(data.roomId, null); // No password for quick play
          }
        };

        const handleError = (error) => {
          console.error('❌ Quick play error:', error);
          socket.off('room_created', handleRoomCreated);
          socket.off('error', handleError);
          showToast.error(error.message || "Failed to start quick play");
          setQuickPlayLoading(false);
        };

        socket.once('room_created', handleRoomCreated);
        socket.once('error', handleError);

        // Create quick game
        socket.emit('create_room', {
          name: `${isGuest ? guestData.username : user?.username}'s Quick Game`,
          timeControl: {
            initialTime,
            increment: incrementTime,
          },
          settings: {
            isPrivate: false,
            password: null,
            autoStart: false,
          },
          isGuest,
          guestUsername: isGuest ? guestData.username : undefined,
        });

        console.log('📤 Sent quick play create_room event');
      }
    } catch (err) {
      console.error('Quick play error:', err);
      showToast.error("Failed to start quick play");
      setQuickPlayLoading(false);
    }
    // Note: Don't reset loading on success - user is navigating away
  };

  // Filter and sort games
  const getFilteredGames = () => {
    let filtered = Array.isArray(games) ? games : [];

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(
        (game) =>
          (game.name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
          game.creator.toLowerCase().includes(searchTerm.toLowerCase()) ||
          game.roomId.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply game filter
    if (gameFilter !== "all") {
      filtered = filtered.filter((game) => {
        switch (gameFilter) {
          case "waiting":
            return game.status === "waiting";
          case "active":
            return game.status === "active";
          case "private":
            return game.isPrivate;
          default:
            return true;
        }
      });
    }

    // Apply sorting
    if (Array.isArray(filtered)) {
      filtered.sort((a, b) => {
        switch (sortBy) {
          case "oldest":
            return new Date(a.createdAt) - new Date(b.createdAt);
          case "name":
            return (a.name || a.creator).localeCompare(b.name || b.creator);
          case "players":
            return (b.players || 1) - (a.players || 1);
          case "newest":
          default:
            return new Date(b.createdAt) - new Date(a.createdAt);
        }
      });
    }

    return filtered;
  };

  const getTimeControlDisplay = (timeControl) => {
    if (!timeControl) return "10+0";
    
    // Handle object format from backend
    if (typeof timeControl === 'object') {
      const minutes = Math.floor(timeControl.initialTime / 60000);
      const increment = Math.floor(timeControl.increment / 1000);
      const timeStr = `${minutes}+${increment}`;
      
      if (minutes === 1) return "Bullet (1+0)";
      if (minutes === 3) return "Blitz (3+0)";
      if (minutes === 5) return "Blitz (5+0)";
      if (minutes === 10) return "Rapid (10+0)";
      if (minutes === 15 && increment === 10) return "Rapid (15+10)";
      if (minutes === 30) return "Classical (30+0)";
      return timeStr;
    }
    
    // Handle string format (legacy)
    if (typeof timeControl === 'string') {
      const [base] = timeControl.split("+");
      if (base === "1") return "Bullet (1+0)";
      if (base === "3") return "Blitz (3+0)";
      if (base === "5") return "Blitz (5+0)";
      if (base === "10") return "Rapid (10+0)";
      if (base === "15") return "Rapid (15+10)";
      if (base === "30") return "Classical (30+0)";
      return timeControl;
    }
    
    return "10+0";
  };

  return (
    <div className={`min-h-screen overflow-hidden ${theme.colors.bg.primary}`}>
      {/* Top Navigation Bar */}
      <nav className={`fixed top-0 left-0 right-0 border-b ${theme.colors.border.primary} ${theme.colors.bg.secondary}`}>
        <div className="mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <div className="flex items-center">
              <img src={chesslogo} className=" h-10 m-0 p-0 invert-100" alt="" />
              <h1 className={`text-3xl mt-2 font-mono font-bold ${theme.colors.text.primary}`}>
                ChessLobby
              </h1>
            </div>

            {/* User Info */}
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-gray-900 flex items-center justify-center text-white font-semibold">
                  {(isGuest ? guestData?.username : user?.username)?.[0]?.toUpperCase() || "U"}
                </div>
                <div>
                  <p className={`text-sm font-medium ${theme.colors.text.primary}`}>
                    {isGuest ? guestData?.username : user?.username}
                    {isGuest && <span className="text-amber-500 text-xs ml-1">(Guest)</span>}
                  </p>
                  <p className={`text-xs ${theme.colors.text.muted}`}>
                    {isGuest ? "Guest Player" : "Registered Player"}
                  </p>
                </div>
              </div>

              {!isGuest && (
                <button
                  onClick={() => setShowProfileManagement(true)}
                  className={`p-2 rounded-lg ${theme.colors.bg.tertiary} hover:${theme.colors.bg.hover} transition-colors`}
                  title="Profile Settings"
                >
                  <Icons.Settings size={18} className={theme.colors.text.muted} />
                </button>
              )}

              <button
                onClick={onLogout}
                className="p-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-500 transition-colors"
                title="Logout"
              >
                <Icons.LogOut size={18} />
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="mx-auto px-6 pt-25">
        <div className="grid grid-cols-12 gap-4">
          {/* Left Sidebar - Quick Actions */}
          <div className="col-span-3 space-y-4">
            <div className={`rounded-sm border ${theme.colors.border.primary} ${theme.colors.bg.secondary} p-5`}>
              <h2 className={`text-lg font-semibold mb-4 ${theme.colors.text.primary}`}>
                Quick Play
              </h2>
              <div className="space-y-3">
                <button
                  onClick={handleQuickPlay}
                  disabled={quickPlayLoading}
                  className={`w-full py-3 px-4 rounded-lg bg-gradient-to-r from-green-500 to-emerald-600 
                    hover:from-green-600 hover:to-emerald-700 text-white font-medium
                    transition-all duration-200 flex items-center justify-center gap-2 shadow-sm
                    ${quickPlayLoading ? 'opacity-75 cursor-not-allowed' : ''}`}
                >
                  {quickPlayLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                      Finding Match...
                    </>
                  ) : (
                    <>
                      <Icons.Lightning size={18} />
                      Quick Match
                    </>
                  )}
                </button>

                {!isGuest ? (
                  <button
                    onClick={() => setShowCreateModal(true)}
                    className="w-full py-3 px-4 rounded-lg bg-gradient-to-r from-blue-500 to-indigo-600 
                      hover:from-blue-600 hover:to-indigo-700 text-white font-medium
                      transition-all duration-200 flex items-center justify-center gap-2 shadow-sm"
                  >
                    <Icons.Plus size={18} />
                    Create Game
                  </button>
                ) : (
                  <button
                    disabled
                    className="w-full py-3 px-4 rounded-lg bg-gray-500/20 text-gray-500 font-medium
                      cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    <Icons.Lock size={16} />
                    Login to Create
                  </button>
                )}

                <button
                  onClick={onPlayPractice}
                  className="w-full py-3 px-4 rounded-lg bg-gradient-to-r from-purple-500 to-pink-600 
                    hover:from-purple-600 hover:to-pink-700 text-white font-medium
                    transition-all duration-200 flex items-center justify-center gap-2 shadow-sm"
                >
                  <Icons.Target size={18} />
                  Practice Mode
                </button>
              </div>
            </div>

            {/* Join by Room ID */}
            <div className={`rounded-sm border ${theme.colors.border.primary} ${theme.colors.bg.secondary} p-5`}>
              <h2 className={`text-lg font-semibold mb-4 ${theme.colors.text.primary}`}>
                Join Room
              </h2>
              {!isGuest ? (
                <div className="flex items-center justify-center h-10 gap-2">
                  <input
                    type="text"
                    value={joinForm.roomId}
                    onChange={(e) =>
                      setJoinForm((prev) => ({
                        ...prev,
                        roomId: e.target.value.toUpperCase(),
                      }))
                    }
                    placeholder="ROOM ID"
                    maxLength={8}
                    className={`px-3 py-2.5 rounded-sm border ${theme.colors.border.primary} 
                      ${theme.colors.bg.tertiary} ${theme.colors.text.primary} 
                      placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 
                      text-center font-mono text-sm tracking-widest uppercase`}
                  />
                  <button
                    onClick={handleJoinByRoomId}
                    disabled={!joinForm.roomId.trim()}
                    className="w-full py-2.5 px-4 rounded-sm bg-blue-500 hover:bg-blue-600 
                      disabled:bg-gray-500/20 disabled:text-gray-500 disabled:cursor-not-allowed
                      text-white font-semibold transition-colors flex items-center justify-center gap-2"
                  >
                    <Icons.Play size={16} />
                    Join
                  </button>
                </div>
              ) : (
                <div className="text-center py-4">
                  <Icons.Lock size={32} className="mx-auto mb-2 text-gray-500" />
                  <p className={`text-sm ${theme.colors.text.muted}`}>
                    Login required for private rooms
                  </p>
                </div>
              )}
            </div>

            {/* Stats */}
            <div className={`rounded-sm border ${theme.colors.border.primary} ${theme.colors.bg.secondary} p-5`}>
              <div className="flex items-center gap-2 mb-2">
                <Icons.Users size={18} className="text-green-500" />
                <span className={`text-sm font-medium ${theme.colors.text.primary}`}>
                  Online Players
                </span>
              </div>
              <p className="text-2xl font-bold text-green-500">{onlineUsers}</p>
            </div>
          </div>

          {/* Main Content - Games List */}
          <div className="col-span-9">
            <div className={`rounded-sm h-full overflow-hidden border ${theme.colors.border.primary} ${theme.colors.bg.secondary}`}>
              {/* Header with Search and Filters */}
              <div className={`p-5 border-b ${theme.colors.border.primary}`}>
                <div className="flex w-full items-center justify-between gap-4">
                    {/* Search */}
                    <div className="relative w-1/2">
                      <Icons.Search 
                        size={18} 
                        className={`absolute left-3 top-1/2 transform -translate-y-1/2 ${theme.colors.text.muted}`}
                      />
                      <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Search games..."
                        className={`w-full pl-10 pr-4 py-2 rounded-lg border ${theme.colors.border.primary} 
                          ${theme.colors.bg.tertiary} ${theme.colors.text.primary} 
                          placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm`}
                      />
                    </div>

                  <div className="flex items-center justify-end gap-3 flex-1 max-w-2xl">
                    {/* Filter */}
                    <select
                      value={gameFilter}
                      onChange={(e) => setGameFilter(e.target.value)}
                      className={`px-3 py-2 rounded-lg border ${theme.colors.border.primary} 
                        ${theme.colors.bg.tertiary} ${theme.colors.text.primary} 
                        focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm`}
                    >
                      <option value="all">All Games</option>
                      <option value="waiting">Waiting</option>
                      <option value="active">Active</option>
                      <option value="private">Private</option>
                    </select>

                    {/* Sort */}
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value)}
                      className={`px-3 py-2 rounded-lg border ${theme.colors.border.primary} 
                        ${theme.colors.bg.tertiary} ${theme.colors.text.primary} 
                        focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm`}
                    >
                      <option value="newest">Newest</option>
                      <option value="oldest">Oldest</option>
                      <option value="name">Name</option>
                      <option value="players">Players</option>
                    </select>

                    {/* Refresh */}
                    <button
                      onClick={loadGames}
                      disabled={loading}
                      className={`p-2 rounded-lg ${theme.colors.bg.tertiary} hover:${theme.colors.bg.hover} 
                        transition-colors disabled:opacity-50`}
                      title="Refresh"
                    >
                      <Icons.RefreshCw 
                        size={18} 
                        className={`${theme.colors.text.muted} ${loading ? "animate-spin" : ""}`}
                      />
                    </button>
                  </div>
                </div>
              </div>

              {/* Games List */}
              <div className="px-5 pt-5 h-full">
                <div className="space-y-2 max-h-[calc(100vh-220px)] overflow-y-auto">
                  {loading ? (
                    <div className="flex flex-col items-center justify-center py-20">
                      <Icons.RefreshCw className="animate-spin text-blue-500 mb-3" size={32} />
                      <p className={`${theme.colors.text.muted}`}>Loading games...</p>
                    </div>
                  ) : getFilteredGames().length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20">
                      <Icons.Search size={48} className={`${theme.colors.text.muted} opacity-30 mb-3`} />
                      <p className={`text-lg ${theme.colors.text.primary} mb-1`}>No games found</p>
                      <p className={`text-sm ${theme.colors.text.muted}`}>
                        Try adjusting your filters or create a new game
                      </p>
                    </div>
                  ) : (
                    getFilteredGames().map((game) => (
                      <div
                        key={game.roomId}
                        className={`rounded-lg border ${theme.colors.border.primary} ${theme.colors.bg.tertiary} 
                          hover:${theme.colors.bg.hover} transition-all duration-150 cursor-pointer p-4`}
                        onClick={() => handleJoinGameClick(game)}
                      >
                        <div className="flex items-center justify-between">
                          {/* Game Info */}
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              {game.settings?.hasPassword && (
                                <Icons.Lock className="text-orange-500" size={14} />
                              )}
                              <h3 className={`font-medium ${theme.colors.text.primary}`}>
                                {game.name || `${game.creator}'s Game`}
                              </h3>
                              <span className="px-2 py-0.5 rounded text-xs font-mono bg-blue-500/10 text-blue-500">
                                {game.roomId}
                              </span>
                              <span
                                className={`px-2 py-0.5 rounded text-xs font-medium ${
                                  game.status === "waiting"
                                    ? "bg-green-500/10 text-green-500"
                                    : "bg-yellow-500/10 text-yellow-500"
                                }`}
                              >
                                {game.status === "waiting" ? "Waiting" : "Active"}
                              </span>
                            </div>

                            <div className={`flex items-center gap-4 text-xs ${theme.colors.text.muted}`}>
                              <span className="flex items-center gap-1">
                                <Icons.User size={12} />
                                {game.creator}
                              </span>
                              <span className="flex items-center gap-1">
                                <Icons.Clock size={12} />
                                {getTimeControlDisplay(game.timeControl)}
                              </span>
                              <span className="flex items-center gap-1">
                                <Icons.Users size={12} />
                                {(game.players?.white ? 1 : 0) + (game.players?.black ? 1 : 0)}/2
                              </span>
                            </div>
                          </div>

                          {/* Join Button */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleJoinGameClick(game);
                            }}
                            className={`px-4 py-2 rounded-lg text-white text-sm font-medium 
                              transition-colors flex items-center gap-2
                              ${game.settings?.hasPassword 
                                ? "bg-orange-500 hover:bg-orange-600" 
                                : "bg-blue-500 hover:bg-blue-600"
                              }`}
                          >
                            <Icons.Play size={14} />
                            Join
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      {/* Password Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div
            className={`border rounded-xl shadow-xl p-6 w-full max-w-md animate-in zoom-in-95 duration-200 ${theme.colors.bg.secondary} ${theme.colors.border.primary}`}
          >
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <Icons.Lock className="text-orange-500" size={20} />
                <h3 className={`text-lg font-semibold ${theme.colors.text.primary}`}>
                  Password Required
                </h3>
              </div>
              <button
                onClick={() => {
                  setShowPasswordModal(false);
                  setPasswordRoomId("");
                  setJoinForm((prev) => ({ ...prev, password: "" }));
                }}
                className={`p-1 ${theme.colors.text.secondary} hover:${theme.colors.text.primary} transition-colors`}
              >
                <Icons.Close size={18} />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleJoinGame(passwordRoomId, joinForm.password);
              }}
              className="space-y-4"
            >
              <div>
                <label className={`block text-xs font-medium mb-2 ${theme.colors.text.muted}`}>
                  Room ID: <span className="font-mono text-blue-500">{passwordRoomId}</span>
                </label>
                <input
                  type="password"
                  value={joinForm.password}
                  onChange={(e) =>
                    setJoinForm((prev) => ({ ...prev, password: e.target.value }))
                  }
                  placeholder="Enter password"
                  autoFocus
                  className={`w-full px-3 py-2.5 rounded-lg border ${theme.colors.border.primary} ${theme.colors.bg.tertiary} ${theme.colors.text.primary} placeholder-gray-400
                    focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm`}
                />
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowPasswordModal(false);
                    setPasswordRoomId("");
                    setJoinForm((prev) => ({ ...prev, password: "" }));
                  }}
                  className={`flex-1 px-4 py-2.5 rounded-lg font-medium transition-colors ${theme.colors.bg.tertiary} hover:${theme.colors.bg.hover} ${theme.colors.text.primary} text-sm`}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2.5 rounded-lg font-medium text-white transition-colors
                    flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-600 text-sm"
                >
                  <Icons.Play size={14} />
                  Join
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create Game Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div
            className={`border rounded-xl shadow-xl p-6 w-full max-w-lg animate-in zoom-in-95 duration-200 ${theme.colors.bg.secondary} ${theme.colors.border.primary}`}
          >
            <div className="flex items-center justify-between mb-5">
              <h3 className={`text-lg font-semibold ${theme.colors.text.primary}`}>
                Create New Game
              </h3>
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setCreateForm({
                    name: "",
                    timeControl: "10+0",
                    isPrivate: false,
                    password: "",
                    isRated: false,
                  });
                }}
                className={`p-1 ${theme.colors.text.secondary} hover:${theme.colors.text.primary} transition-colors`}
              >
                <Icons.Close size={18} />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleCreateGame();
              }}
              className="space-y-4"
            >
              {/* Room Privacy Toggle */}
              <div>
                <label className={`block text-xs font-medium mb-2 ${theme.colors.text.muted}`}>
                  Visibility
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      setCreateForm((prev) => ({ ...prev, isPrivate: false, password: "" }))
                    }
                    className={`px-3 py-2.5 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 text-sm border
                      ${
                        !createForm.isPrivate
                          ? "bg-blue-500/10 border-blue-500 text-blue-500"
                          : `${theme.colors.bg.tertiary} ${theme.colors.border.primary} ${theme.colors.text.secondary} hover:${theme.colors.bg.hover}`
                      }`}
                  >
                    <Icons.Globe size={16} />
                    Public
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setCreateForm((prev) => ({ ...prev, isPrivate: true }))
                    }
                    className={`px-3 py-2.5 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 text-sm border
                      ${
                        createForm.isPrivate
                          ? "bg-orange-500/10 border-orange-500 text-orange-500"
                          : `${theme.colors.bg.tertiary} ${theme.colors.border.primary} ${theme.colors.text.secondary} hover:${theme.colors.bg.hover}`
                      }`}
                  >
                    <Icons.Lock size={16} />
                    Private
                  </button>
                </div>
              </div>

              <div>
                <label className={`block text-xs font-medium mb-2 ${theme.colors.text.muted}`}>
                  Game Name
                </label>
                <input
                  type="text"
                  value={createForm.name}
                  onChange={(e) =>
                    setCreateForm((prev) => ({ ...prev, name: e.target.value }))
                  }
                  placeholder="Enter game name"
                  required
                  className={`w-full px-3 py-2.5 rounded-lg border ${theme.colors.border.primary} ${theme.colors.bg.tertiary} ${theme.colors.text.primary} placeholder-gray-400
                    focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm`}
                />
              </div>

              {createForm.isPrivate && (
                <div>
                  <label className={`block text-xs font-medium mb-2 ${theme.colors.text.muted}`}>
                    Password (Optional)
                  </label>
                  <input
                    type="password"
                    value={createForm.password}
                    onChange={(e) =>
                      setCreateForm((prev) => ({
                        ...prev,
                        password: e.target.value,
                      }))
                    }
                    placeholder="Leave empty for no password"
                    className={`w-full px-3 py-2.5 rounded-lg border ${theme.colors.border.primary} ${theme.colors.bg.tertiary} ${theme.colors.text.primary} placeholder-gray-400
                      focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm`}
                  />
                </div>
              )}

              <div>
                <label className={`block text-xs font-medium mb-2 ${theme.colors.text.muted}`}>
                  Time Control
                </label>
                <select
                  value={createForm.timeControl}
                  onChange={(e) =>
                    setCreateForm((prev) => ({
                      ...prev,
                      timeControl: e.target.value,
                    }))
                  }
                  className={`w-full px-3 py-2.5 rounded-lg border ${theme.colors.border.primary} ${theme.colors.bg.tertiary} ${theme.colors.text.primary}
                    focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm`}
                >
                  <option value="1+0" className={theme.isDark ? "bg-gray-800" : "bg-gray-100"}>
                    Bullet (1+0)
                  </option>
                  <option value="3+0" className={theme.isDark ? "bg-gray-800" : "bg-gray-100"}>
                    Blitz (3+0)
                  </option>
                  <option value="5+0" className={theme.isDark ? "bg-gray-800" : "bg-gray-100"}>
                    Blitz (5+0)
                  </option>
                  <option value="10+0" className={theme.isDark ? "bg-gray-800" : "bg-gray-100"}>
                    Rapid (10+0)
                  </option>
                  <option value="15+10" className={theme.isDark ? "bg-gray-800" : "bg-gray-100"}>
                    Rapid (15+10)
                  </option>
                  <option value="30+0" className={theme.isDark ? "bg-gray-800" : "bg-gray-100"}>
                    Classical (30+0)
                  </option>
                </select>
              </div>

              {!isGuest && (
                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="checkbox"
                    id="isRated"
                    checked={createForm.isRated}
                    onChange={(e) =>
                      setCreateForm((prev) => ({
                        ...prev,
                        isRated: e.target.checked,
                      }))
                    }
                    className="w-4 h-4 text-blue-500 rounded focus:ring-blue-500"
                  />
                  <label htmlFor="isRated" className={`text-sm ${theme.colors.text.secondary}`}>
                    Rated Game
                  </label>
                </div>
              )}

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false);
                    setCreateForm({
                      name: "",
                      timeControl: "10+0",
                      isPrivate: false,
                      password: "",
                      isRated: false,
                    });
                  }}
                  className={`flex-1 px-4 py-2.5 rounded-lg font-medium transition-colors ${theme.colors.bg.tertiary} hover:${theme.colors.bg.hover} ${theme.colors.text.primary} text-sm`}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={`flex-1 px-4 py-2.5 rounded-lg font-medium text-white transition-colors
                    flex items-center justify-center gap-2 text-sm
                    ${
                      createForm.isPrivate
                        ? "bg-orange-500 hover:bg-orange-600"
                        : "bg-blue-500 hover:bg-blue-600"
                    }`}
                >
                  {createForm.isPrivate ? (
                    <Icons.Lock size={14} />
                  ) : (
                    <Icons.Plus size={14} />
                  )}
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Profile Management Modal */}
      {showProfileManagement && (
        <ProfileManagement
          isOpen={showProfileManagement}
          onClose={() => setShowProfileManagement(false)}
          onLogout={onLogout}
          isGuest={isGuest}
        />
      )}
    </div>
  );
};

export default GameLobby;
