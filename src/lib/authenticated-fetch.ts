import { auth } from './firebase.ts';

/**
 * Sends the currently signed-in Firebase user's ID token with a request.
 * Protected Express routes verify this token with Firebase Admin.
 */
export async function authenticatedFetch(input: RequestInfo | URL, init: RequestInit = {}) {
  const currentUser = auth.currentUser;
  if (!currentUser) {
    throw new Error('Please sign in with Google before continuing.');
  }

  const idToken = await currentUser.getIdToken();
  const headers = new Headers(init.headers);
  headers.set('Authorization', `Bearer ${idToken}`);

  return fetch(input, { ...init, headers });
}
