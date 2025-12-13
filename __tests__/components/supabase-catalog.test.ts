/**
 * Unit Tests for Supabase Component Catalog
 * 
 * Tests for component loading, saving, and caching.
 * 
 * Stage 2 Module 5: Component System from Supabase
 */

import { getComponentCatalog, saveComponent, updateComponent, deleteComponent } from '@/lib/components/supabase-catalog';
import { supabase } from '@/lib/supabase/client';
import { getRedisClient } from '@/lib/redis/client';

// Mock Supabase
jest.mock('@/lib/supabase/client', () => ({
  supabase: {
    from: jest.fn(),
    auth: {
      getUser: jest.fn(),
    },
  },
}));

// Mock Redis
jest.mock('@/lib/redis/client', () => ({
  getRedisClient: jest.fn(() => ({
    get: jest.fn(),
    setex: jest.fn(),
    del: jest.fn(),
  })),
}));

// Mock static catalog fallback
jest.mock('@/lib/components/catalog', () => ({
  componentCatalog: [
    {
      id: 'test-1',
      name: 'Test Component',
      category: 'header',
      description: 'Test',
      variants: {
        minimal: '<header>Test</header>',
      },
    },
  ],
}));

describe('Supabase Component Catalog', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getComponentCatalog', () => {
    it('should load components from Redis cache if available', async () => {
      const mockRedis = getRedisClient();
      const cachedComponents = [{ id: '1', name: 'Cached', category: 'header', html: '<div></div>', is_public: true, usage_count: 0, created_at: new Date().toISOString(), updated_at: new Date().toISOString() }];
      
      (mockRedis.get as jest.Mock).mockResolvedValue(JSON.stringify(cachedComponents));

      const result = await getComponentCatalog();

      expect(mockRedis.get).toHaveBeenCalledWith('component_catalog');
      expect(result).toEqual(cachedComponents);
    });

    it('should load from Supabase if cache miss', async () => {
      const mockRedis = getRedisClient();
      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockResolvedValue({
          data: [{ id: '1', name: 'DB Component', category: 'header', html: '<div></div>', is_public: true, usage_count: 0, created_at: new Date().toISOString(), updated_at: new Date().toISOString() }],
          error: null,
        }),
      };

      (mockRedis.get as jest.Mock).mockResolvedValue(null);
      (supabase.from as jest.Mock).mockReturnValue(mockQuery);

      const result = await getComponentCatalog();

      expect(supabase.from).toHaveBeenCalledWith('components');
      expect(result.length).toBeGreaterThan(0);
    });

    it('should fallback to static catalog on error', async () => {
      const mockRedis = getRedisClient();
      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockResolvedValue({
          data: null,
          error: { message: 'Database error' },
        }),
      };

      (mockRedis.get as jest.Mock).mockResolvedValue(null);
      (supabase.from as jest.Mock).mockReturnValue(mockQuery);

      const result = await getComponentCatalog();

      // Should return static catalog as fallback
      expect(result.length).toBeGreaterThan(0);
    });
  });

  describe('saveComponent', () => {
    it('should require authentication', async () => {
      (supabase.auth.getUser as jest.Mock).mockResolvedValue({
        data: { user: null },
        error: { message: 'Not authenticated' },
      });

      await expect(
        saveComponent({
          name: 'Test',
          category: 'header',
          html: '<div></div>',
          is_public: false,
        })
      ).rejects.toThrow('Authentication required');
    });

    it('should save component for authenticated user', async () => {
      const mockUser = { id: 'user-123' };
      const mockQuery = {
        insert: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: { id: 'comp-1', name: 'Test', category: 'header', html: '<div></div>', user_id: 'user-123', is_public: false, usage_count: 0, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
          error: null,
        }),
      };

      (supabase.auth.getUser as jest.Mock).mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });
      (supabase.from as jest.Mock).mockReturnValue(mockQuery);

      const result = await saveComponent({
        name: 'Test',
        category: 'header',
        html: '<div></div>',
        is_public: false,
      });

      expect(result.user_id).toBe('user-123');
      expect(mockQuery.insert).toHaveBeenCalled();
    });
  });

  describe('updateComponent', () => {
    it('should only allow updating own components', async () => {
      const mockUser = { id: 'user-123' };
      const mockQuery = {
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: null,
          error: { message: 'Not found' },
        }),
      };

      (supabase.auth.getUser as jest.Mock).mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });
      (supabase.from as jest.Mock).mockReturnValue(mockQuery);

      await expect(
        updateComponent('comp-1', { name: 'Updated' })
      ).rejects.toThrow();
    });
  });

  describe('deleteComponent', () => {
    it('should only allow deleting own components', async () => {
      const mockUser = { id: 'user-123' };
      const mockQuery = {
        delete: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
      };

      (supabase.auth.getUser as jest.Mock).mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });
      (supabase.from as jest.Mock).mockReturnValue(mockQuery);
      (mockQuery.eq as jest.Mock).mockResolvedValue({ error: null });

      await deleteComponent('comp-1');

      expect(mockQuery.delete).toHaveBeenCalled();
      expect(mockQuery.eq).toHaveBeenCalledWith('user_id', 'user-123');
    });
  });
});








