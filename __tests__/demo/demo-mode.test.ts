/**
 * Unit Tests for Demo Mode
 * 
 * Tests for demo session limits and enforcement.
 * 
 * Stage 3 Module 9: Cookies and Demo Mode
 */

import {
  getDemoSession,
  isDemoMode,
  canCreateProject,
  canSaveOrExport,
  incrementDemoProjectCount,
  getRemainingDemoTime,
  getRemainingDemoTimeFormatted,
  clearDemoSession,
} from '@/lib/utils/demo-mode';

// Mock js-cookie
jest.mock('js-cookie', () => ({
  get: jest.fn(),
  set: jest.fn(),
  remove: jest.fn(),
}));

describe('Demo Mode', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    clearDemoSession();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('getDemoSession', () => {
    it('should initialize new session if none exists', () => {
      const Cookies = require('js-cookie');
      Cookies.get.mockReturnValue(undefined);

      const session = getDemoSession();

      expect(session.startTime).toBeGreaterThan(0);
      expect(session.projectCount).toBe(0);
      expect(session.isActive).toBe(true);
    });

    it('should return existing session', () => {
      const Cookies = require('js-cookie');
      const startTime = Date.now();
      Cookies.get.mockImplementation((key: string) => {
        if (key === 'demo_start_time') return startTime.toString();
        if (key === 'demo_project_count') return '0';
        return undefined;
      });

      const session = getDemoSession();

      expect(session.startTime).toBe(startTime);
      expect(session.isActive).toBe(true);
    });

    it('should mark session as inactive after 2 hours', () => {
      const Cookies = require('js-cookie');
      const startTime = Date.now() - (3 * 60 * 60 * 1000); // 3 hours ago
      Cookies.get.mockImplementation((key: string) => {
        if (key === 'demo_start_time') return startTime.toString();
        if (key === 'demo_project_count') return '0';
        return undefined;
      });

      const session = getDemoSession();

      expect(session.isActive).toBe(false);
    });

    it('should mark session as inactive after max projects', () => {
      const Cookies = require('js-cookie');
      const startTime = Date.now();
      Cookies.get.mockImplementation((key: string) => {
        if (key === 'demo_start_time') return startTime.toString();
        if (key === 'demo_project_count') return '1'; // Max reached
        return undefined;
      });

      const session = getDemoSession();

      expect(session.isActive).toBe(false);
    });
  });

  describe('canCreateProject', () => {
    it('should allow creation if session is active and under limit', () => {
      const Cookies = require('js-cookie');
      Cookies.get.mockImplementation((key: string) => {
        if (key === 'demo_start_time') return Date.now().toString();
        if (key === 'demo_project_count') return '0';
        return undefined;
      });

      expect(canCreateProject()).toBe(true);
    });

    it('should disallow creation if limit reached', () => {
      const Cookies = require('js-cookie');
      Cookies.get.mockImplementation((key: string) => {
        if (key === 'demo_start_time') return Date.now().toString();
        if (key === 'demo_project_count') return '1';
        return undefined;
      });

      expect(canCreateProject()).toBe(false);
    });
  });

  describe('incrementDemoProjectCount', () => {
    it('should increment count and return true', () => {
      const Cookies = require('js-cookie');
      Cookies.get.mockImplementation((key: string) => {
        if (key === 'demo_start_time') return Date.now().toString();
        if (key === 'demo_project_count') return '0';
        return undefined;
      });

      const result = incrementDemoProjectCount();

      expect(result).toBe(true);
      expect(Cookies.set).toHaveBeenCalledWith('demo_project_count', '1', { expires: 1 });
    });

    it('should return false if limit reached', () => {
      const Cookies = require('js-cookie');
      Cookies.get.mockImplementation((key: string) => {
        if (key === 'demo_start_time') return Date.now().toString();
        if (key === 'demo_project_count') return '1';
        return undefined;
      });

      const result = incrementDemoProjectCount();

      expect(result).toBe(false);
    });
  });

  describe('getRemainingDemoTime', () => {
    it('should return remaining time', () => {
      const Cookies = require('js-cookie');
      const startTime = Date.now() - (30 * 60 * 1000); // 30 minutes ago
      Cookies.get.mockImplementation((key: string) => {
        if (key === 'demo_start_time') return startTime.toString();
        if (key === 'demo_project_count') return '0';
        return undefined;
      });

      const remaining = getRemainingDemoTime();
      const expected = 2 * 60 * 60 * 1000 - (30 * 60 * 1000); // 2h - 30m

      expect(remaining).toBeCloseTo(expected, -3); // Within 1 second
    });

    it('should return 0 if session expired', () => {
      const Cookies = require('js-cookie');
      const startTime = Date.now() - (3 * 60 * 60 * 1000); // 3 hours ago
      Cookies.get.mockImplementation((key: string) => {
        if (key === 'demo_start_time') return startTime.toString();
        if (key === 'demo_project_count') return '0';
        return undefined;
      });

      const remaining = getRemainingDemoTime();

      expect(remaining).toBe(0);
    });
  });

  describe('getRemainingDemoTimeFormatted', () => {
    it('should format time with hours and minutes', () => {
      const Cookies = require('js-cookie');
      const startTime = Date.now() - (30 * 60 * 1000); // 30 minutes ago
      Cookies.get.mockImplementation((key: string) => {
        if (key === 'demo_start_time') return startTime.toString();
        if (key === 'demo_project_count') return '0';
        return undefined;
      });

      const formatted = getRemainingDemoTimeFormatted();

      expect(formatted).toMatch(/\d+h \d+m/);
    });

    it('should format time with minutes only if less than 1 hour', () => {
      const Cookies = require('js-cookie');
      const startTime = Date.now() - (90 * 60 * 1000); // 1.5 hours ago
      Cookies.get.mockImplementation((key: string) => {
        if (key === 'demo_start_time') return startTime.toString();
        if (key === 'demo_project_count') return '0';
        return undefined;
      });

      const formatted = getRemainingDemoTimeFormatted();

      expect(formatted).toMatch(/\d+m/);
      expect(formatted).not.toMatch(/h/);
    });
  });
});








