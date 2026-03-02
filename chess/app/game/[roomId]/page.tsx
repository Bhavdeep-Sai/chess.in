'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import MultiplayerChessBoard from '../../components/MultiplayerChessBoard';
import { useAuth } from '../../hooks/useAuth';

export default function GamePage() {
  const params = useParams();
  const router = useRouter();
  const roomId = params.roomId as string;
  const { isAuthenticated } = useAuth();
  const [guestData, setGuestData] = useState<{ id: string; username: string } | null>(null);

  useEffect(() => {
    if (!roomId) {
      router.push('/');
      return;
    }

    // Load guest data if not authenticated
    if (!isAuthenticated) {
      const storedGuestData = localStorage.getItem('guestData') || sessionStorage.getItem('guestData');
      if (storedGuestData) {
        try {
          setGuestData(JSON.parse(storedGuestData));
        } catch (error) {
          console.error('Error parsing guest data:', error);
          router.push('/');
        }
      } else {
        router.push('/');
      }
    }
  }, [roomId, router, isAuthenticated]);

  const handleLeaveGame = () => {
    router.push('/');
  };

  return (
    <div className="min-h-screen bg-gray-900">
      <MultiplayerChessBoard
        roomId={roomId}
        isGuest={!isAuthenticated}
        guestData={guestData}
        onLeaveGame={handleLeaveGame}
      />
    </div>
  );
}
