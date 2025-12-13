/**
 * Supabase Realtime Utilities
 * 
 * Real-time subscriptions for admin shadow mode.
 * 
 * Stage 3 Module 8: Shadow Mode
 */

import { createSupabaseClient } from './client';
import type { RealtimeChannel } from '@supabase/supabase-js';

export interface ProjectUpdate {
  id: string;
  user_id: string;
  name: string;
  updated_at: string;
  action: 'INSERT' | 'UPDATE' | 'DELETE';
}

/**
 * Subscribe to projects table changes
 */
export function subscribeToProjects(
  onUpdate: (update: ProjectUpdate) => void
): RealtimeChannel {
  const supabase = createSupabaseClient();
  
  const channel = supabase
    .channel('projects-changes')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'projects',
      },
      (payload) => {
        const update: ProjectUpdate = {
          id: payload.new?.id || payload.old?.id || '',
          user_id: payload.new?.user_id || payload.old?.user_id || '',
          name: payload.new?.name || payload.old?.name || '',
          updated_at: payload.new?.updated_at || payload.old?.updated_at || new Date().toISOString(),
          action: payload.eventType as 'INSERT' | 'UPDATE' | 'DELETE',
        };
        onUpdate(update);
      }
    )
    .subscribe();

  return channel;
}

/**
 * Subscribe to components table changes
 */
export function subscribeToComponents(
  onUpdate: (update: { id: string; name: string; category: string; action: 'INSERT' | 'UPDATE' | 'DELETE' }) => void
): RealtimeChannel {
  const supabase = createSupabaseClient();
  
  const channel = supabase
    .channel('components-changes')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'components',
      },
      (payload) => {
        onUpdate({
          id: payload.new?.id || payload.old?.id || '',
          name: payload.new?.name || payload.old?.name || '',
          category: payload.new?.category || payload.old?.category || '',
          action: payload.eventType as 'INSERT' | 'UPDATE' | 'DELETE',
        });
      }
    )
    .subscribe();

  return channel;
}

/**
 * Unsubscribe from channel
 */
export function unsubscribe(channel: RealtimeChannel) {
  const supabase = createSupabaseClient();
  supabase.removeChannel(channel);
}








