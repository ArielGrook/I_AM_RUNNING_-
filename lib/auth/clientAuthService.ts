/**
 * Client-side auth for deployed sites: uses dynamic Supabase url/anonKey from props.
 * Session is stored in localStorage and iam_auth_changed is dispatched for HeaderTron etc.
 */

import { createClient, type Session } from '@supabase/supabase-js';

const STORAGE_KEY = 'iam_client_session';

function getClient(url: string, anonKey: string) {
  return createClient(url, anonKey);
}

export async function signUp(
  url: string,
  anonKey: string,
  payload: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
  }
) {
  const client = getClient(url, anonKey);
  const { data, error } = await client.auth.signUp({
    email: payload.email,
    password: payload.password,
    options: {
      data: {
        first_name: payload.firstName,
        last_name: payload.lastName,
      },
    },
  });
  if (data.session) saveSession(data.session);
  if (data.user && !error) {
    try {
      await client
        .from('profiles')
        .upsert(
          {
            id: data.user.id,
            first_name: payload.firstName,
            last_name: payload.lastName,
            email: payload.email,
          },
          { onConflict: 'id' }
        );
    } catch {
      // ignore – trigger may have already created profile
    }
  }
  return { data, error };
}

export async function signIn(
  url: string,
  anonKey: string,
  payload: { email: string; password: string }
) {
  const client = getClient(url, anonKey);
  const { data, error } = await client.auth.signInWithPassword({
    email: payload.email,
    password: payload.password,
  });
  if (data.session) saveSession(data.session);
  return { data, error };
}

export async function signOut(url: string, anonKey: string) {
  const client = getClient(url, anonKey);
  await client.auth.signOut();
  clearSession();
  window.dispatchEvent(new Event('iam_auth_changed'));
}

export function saveSession(session: Session) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
  } catch {
    // ignore
  }
  window.dispatchEvent(new Event('iam_auth_changed'));
}

export function clearSession() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}

export function getStoredSession(): { user?: { user_metadata?: { first_name?: string; last_name?: string } } } | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as { user?: { user_metadata?: { first_name?: string; last_name?: string } } }) : null;
  } catch {
    return null;
  }
}
