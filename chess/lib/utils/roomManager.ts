import Game from '../models/Game';

interface RoomData {
  lastActivity: number;
  roomId: string;
  playerCount: number;
}

/**
 * Room Manager - Handles room lifecycle and cleanup
 */
class RoomManager {
  private rooms: Map<string, RoomData>;
  private cleanupInterval: NodeJS.Timeout | null;
  private INACTIVE_TIMEOUT: number;
  private WAITING_TIMEOUT: number;

  constructor() {
    this.rooms = new Map();
    this.cleanupInterval = null;
    this.INACTIVE_TIMEOUT = 30 * 60 * 1000; // 30 minutes for active games
    this.WAITING_TIMEOUT = 10 * 60 * 1000; // 10 minutes for waiting rooms
  }

  init() {
    this.cleanupInterval = setInterval(() => {
      this.cleanupInactiveRooms();
    }, 5 * 60 * 1000); // Check every 5 minutes

    console.log('✅ Room manager initialized');
  }

  destroy() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
    console.log('Room manager destroyed');
  }

  updateRoomActivity(roomId: string) {
    const existing = this.rooms.get(roomId);
    this.rooms.set(roomId, {
      lastActivity: Date.now(),
      roomId,
      playerCount: existing?.playerCount || 0
    });
  }

  updatePlayerCount(roomId: string, count: number) {
    const existing = this.rooms.get(roomId) || { lastActivity: Date.now(), roomId, playerCount: 0 };
    this.rooms.set(roomId, {
      ...existing,
      playerCount: count
    });
  }

  removeRoom(roomId: string) {
    this.rooms.delete(roomId);
    console.log(`🗑️ Room ${roomId} removed from tracking`);
  }

  hasRoom(roomId: string): boolean {
    return this.rooms.has(roomId);
  }

  getRoomInfo(roomId: string): RoomData | undefined {
    return this.rooms.get(roomId);
  }

  async cleanupInactiveRooms() {
    try {
      console.log('🧹 Starting room cleanup...');
      const now = Date.now();
      let cleanedCount = 0;
      
      const games = await Game.find({
        gameStatus: { $in: ['waiting', 'active'] }
      });

      for (const game of games) {
        const roomData = this.rooms.get(game.roomId);
        const lastActivity = roomData ? roomData.lastActivity : game.updatedAt.getTime();
        const timeSinceActivity = now - lastActivity;
        
        const shouldCleanup = 
          (game.gameStatus === 'waiting' && timeSinceActivity > this.WAITING_TIMEOUT) ||
          (game.gameStatus === 'active' && timeSinceActivity > this.INACTIVE_TIMEOUT);
        
        if (shouldCleanup) {
          await Game.deleteOne({ _id: game._id });
          this.removeRoom(game.roomId);
          cleanedCount++;
          console.log(`🗑️ Cleaned up inactive room: ${game.roomId}`);
        }
      }

      if (cleanedCount > 0) {
        console.log(`🧹 Cleanup complete. Removed ${cleanedCount} inactive rooms.`);
      } else {
        console.log('🧹 Cleanup complete. No rooms needed cleanup.');
      }
    } catch (error) {
      console.error('Error in cleanup:', error);
    }
  }
}

// Create singleton instance
const roomManager = new RoomManager();

export default roomManager;
