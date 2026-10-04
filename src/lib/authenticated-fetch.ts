import { supabase } from './supabase.ts';

/**
 * Sends the current Supabase access token to protected Express routes.
 */
export async function authenticatedFetch(input: RequestInfo | URL, init: RequestInit = {}) {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    throw new Error('Please sign in with Google before continuing.');
  }

  const headers = new Headers(init.headers);
  headers.set('Authorization', `Bearer ${session.access_token}`);

  return fetch(input, { ...init, headers });
}
