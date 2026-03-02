'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from './hooks/useAuth';
import WelcomePage from './components/WelcomePage';
import LoginForm from './components/auth/LoginForm';
import RegisterForm from './components/auth/RegisterForm';
import GameLobby from './components/GameLobby';

export default function Home() {
  const [appMode, setAppMode] = useState<'welcome' | 'auth' | 'lobby'>('welcome');
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [guestData, setGuestData] = useState<{ id: string; username: string } | null>(null);
  const { isAuthenticated, logout } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Check for existing session on mount
    const existingGuestData = localStorage.getItem('guestData') || sessionStorage.getItem('guestData');
    
    if (isAuthenticated) {
      // User is logged in, go to lobby
      setAppMode('lobby');
    } else if (existingGuestData) {
      // Has guest session, go to lobby
      try {
        const parsed = JSON.parse(existingGuestData);
        setGuestData(parsed);
        setAppMode('lobby');
      } catch (error) {
        console.error('Error parsing guest data:', error);
      }
    }
  }, [isAuthenticated]);

  const handleGetStarted = () => {
    // Show auth forms (login/register)
    setAuthMode('login');
    setAppMode('auth');
  };

  const handleAuthSuccess = () => {
    // After successful login/register, go to lobby
    setAppMode('lobby');
  };

  const handleSwitchAuthMode = () => {
    setAuthMode(authMode === 'login' ? 'register' : 'login');
  };

  const handlePlayAsGuest = () => {
    // Generate guest data and go to lobby
    const guestId = 'guest_' + Math.random().toString(36).substr(2, 9);
    const guestUsername = 'Guest_' + Math.random().toString(36).substr(2, 5);
    const guestInfo = { id: guestId, username: guestUsername };
    
    setGuestData(guestInfo);
    localStorage.setItem('guestData', JSON.stringify(guestInfo));
    setAppMode('lobby');
  };

  const handleLogout = () => {
    // Clear auth and guest data
    logout();
    localStorage.removeItem('guestData');
    sessionStorage.removeItem('guestData');
    setGuestData(null);
    setAppMode('welcome');
  };

  const handleJoinGame = (roomId: string) => {
    console.log('Navigating to game room:', roomId);
    router.push(`/game/${roomId}`);
  };

  const handleCreateGame = (roomId: string) => {
    console.log('Navigating to created game room:', roomId);
    router.push(`/game/${roomId}`);
  };

  const handlePlayPractice = () => {
    console.log('Starting practice mode');
    router.push('/practice');
  };

  return (
    <main className="min-h-screen">
      {appMode === 'welcome' && (
        <WelcomePage onGetStarted={handleGetStarted} />
      )}
      
      {appMode === 'auth' && authMode === 'login' && (
        <LoginForm 
          onSuccess={handleAuthSuccess}
          onSwitchToRegister={handleSwitchAuthMode}
          onPlayAsGuest={handlePlayAsGuest}
        />
      )}
      
      {appMode === 'auth' && authMode === 'register' && (
        <RegisterForm 
          onSuccess={handleAuthSuccess}
          onSwitchToLogin={handleSwitchAuthMode}
        />
      )}
      
      {appMode === 'lobby' && (
        <GameLobby 
          isGuest={!isAuthenticated}
          guestData={guestData}
          onLogout={handleLogout}
          onJoinGame={handleJoinGame}
          onCreateGame={handleCreateGame}
          onPlayPractice={handlePlayPractice}
        />
      )}
    </main>
  );
}
