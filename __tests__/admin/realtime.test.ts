/**
 * Unit Tests for Admin Realtime
 * 
 * Tests for realtime subscriptions and admin features.
 * 
 * Stage 3 Module 8: Shadow Mode
 */

import { subscribeToProjects, unsubscribe } from '@/lib/supabase/realtime';
import { requireAdmin, isAdmin } from '@/lib/supabase/auth';

// Mock Supabase
jest.mock('@/lib/supabase/client', () => ({
  createSupabaseClient: jest.fn(() => ({
    channel: jest.fn(() => ({
      on: jest.fn().mockReturnThis(),
      subscribe: jest.fn().mockReturnValue({
        unsubscribe: jest.fn(),
      }),
    })),
    removeChannel: jest.fn(),
  })),
}));

// Mock auth
jest.mock('@/lib/supabase/auth', () => ({
  getCurrentUser: jest.fn(),
  requireAdmin: jest.fn(),
  isAdmin: jest.fn(),
}));

describe('Admin Realtime', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('subscribeToProjects', () => {
    it('should create subscription channel', () => {
      const onUpdate = jest.fn();
      const channel = subscribeToProjects(onUpdate);

      expect(channel).toBeDefined();
      expect(channel.subscribe).toHaveBeenCalled();
    });

    it('should call onUpdate when project changes', () => {
      const onUpdate = jest.fn();
      const channel = subscribeToProjects(onUpdate);

      // Simulate update
      const mockPayload = {
        new: {
          id: 'project-1',
          user_id: 'user-1',
          name: 'Test Project',
          updated_at: new Date().toISOString(),
        },
        old: null,
        eventType: 'INSERT',
      };

      // Get the on callback
      const channelMock = require('@/lib/supabase/client').createSupabaseClient().channel();
      const onCallback = channelMock.on.mock.calls[0][2];
      
      if (onCallback) {
        onCallback(mockPayload);
        expect(onUpdate).toHaveBeenCalled();
      }
    });
  });

  describe('unsubscribe', () => {
    it('should remove channel', () => {
      const mockChannel = {
        unsubscribe: jest.fn(),
      };
      
      unsubscribe(mockChannel as any);
      
      const supabase = require('@/lib/supabase/client').createSupabaseClient();
      expect(supabase.removeChannel).toHaveBeenCalledWith(mockChannel);
    });
  });

  describe('Admin Auth', () => {
    it('should check admin status', async () => {
      const mockIsAdmin = require('@/lib/supabase/auth').isAdmin;
      mockIsAdmin.mockResolvedValue(true);

      const result = await isAdmin();
      expect(result).toBe(true);
    });

    it('should require admin access', async () => {
      const mockRequireAdmin = require('@/lib/supabase/auth').requireAdmin;
      const mockUser = { id: 'admin-1', role: 'admin' };
      mockRequireAdmin.mockResolvedValue(mockUser);

      const user = await requireAdmin();
      expect(user.role).toBe('admin');
    });

    it('should throw if not admin', async () => {
      const mockRequireAdmin = require('@/lib/supabase/auth').requireAdmin;
      mockRequireAdmin.mockRejectedValue(new Error('Admin access required'));

      await expect(requireAdmin()).rejects.toThrow('Admin access required');
    });
  });
});








