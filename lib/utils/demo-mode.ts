/**
 * Demo Mode Utilities
 * 
 * Demo session management with time and project limits.
 * 
 * Stage 3 Module 9: Cookies and Demo Mode
 */

import Cookies from 'js-cookie';

const DEMO_SESSION_KEY = 'demo_session';
const DEMO_START_TIME_KEY = 'demo_start_time';
const DEMO_PROJECT_COUNT_KEY = 'demo_project_count';
const DEMO_DURATION_MS = 2 * 60 * 60 * 1000; // 2 hours
const DEMO_MAX_PROJECTS = 1;

export interface DemoSession {
  startTime: number;
  projectCount: number;
  isActive: boolean;
}

/**
 * Initialize or get demo session
 */
export function getDemoSession(): DemoSession {
  const startTimeStr = Cookies.get(DEMO_START_TIME_KEY);
  const projectCountStr = Cookies.get(DEMO_PROJECT_COUNT_KEY);
  
  const startTime = startTimeStr ? parseInt(startTimeStr, 10) : Date.now();
  const projectCount = projectCountStr ? parseInt(projectCountStr, 10) : 0;
  
  const elapsed = Date.now() - startTime;
  const isActive = elapsed < DEMO_DURATION_MS && projectCount < DEMO_MAX_PROJECTS;
  
  // Update cookies if session expired
  if (!isActive && startTimeStr) {
    clearDemoSession();
  } else if (!startTimeStr) {
    // Initialize new session
    Cookies.set(DEMO_START_TIME_KEY, startTime.toString(), { expires: 1 }); // 1 day
    Cookies.set(DEMO_PROJECT_COUNT_KEY, '0', { expires: 1 });
  }
  
  return {
    startTime,
    projectCount,
    isActive,
  };
}

/**
 * Check if demo mode is active
 */
export function isDemoMode(): boolean {
  const session = getDemoSession();
  return session.isActive;
}

/**
 * Increment project count
 */
export function incrementDemoProjectCount(): boolean {
  const session = getDemoSession();
  
  if (!session.isActive) {
    return false;
  }
  
  const newCount = session.projectCount + 1;
  
  if (newCount >= DEMO_MAX_PROJECTS) {
    // Limit reached
    Cookies.set(DEMO_PROJECT_COUNT_KEY, newCount.toString(), { expires: 1 });
    return false;
  }
  
  Cookies.set(DEMO_PROJECT_COUNT_KEY, newCount.toString(), { expires: 1 });
  return true;
}

/**
 * Check if can create new project
 */
export function canCreateProject(): boolean {
  const session = getDemoSession();
  return session.isActive && session.projectCount < DEMO_MAX_PROJECTS;
}

/**
 * Check if can save/export (demo limits)
 */
export function canSaveOrExport(): boolean {
  return isDemoMode();
}

/**
 * Get remaining time in demo session (milliseconds)
 */
export function getRemainingDemoTime(): number {
  const session = getDemoSession();
  if (!session.isActive) {
    return 0;
  }
  
  const elapsed = Date.now() - session.startTime;
  return Math.max(0, DEMO_DURATION_MS - elapsed);
}

/**
 * Get remaining time formatted (e.g., "1h 30m")
 */
export function getRemainingDemoTimeFormatted(): string {
  const remaining = getRemainingDemoTime();
  if (remaining === 0) {
    return '0m';
  }
  
  const hours = Math.floor(remaining / (60 * 60 * 1000));
  const minutes = Math.floor((remaining % (60 * 60 * 1000)) / (60 * 1000));
  
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m`;
}

/**
 * Clear demo session
 */
export function clearDemoSession(): void {
  Cookies.remove(DEMO_START_TIME_KEY);
  Cookies.remove(DEMO_PROJECT_COUNT_KEY);
  Cookies.remove(DEMO_SESSION_KEY);
}

/**
 * Check if feature is available in demo mode
 */
export function isFeatureAvailableInDemo(feature: 'save' | 'export' | 'chat' | 'import'): boolean {
  if (!isDemoMode()) {
    return false;
  }
  
  // All features available in demo, but with limits
  return true;
}








