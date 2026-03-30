import { User } from '../types';

export async function syncUserToBackend(user: User): Promise<void> {
  try {
    await fetch('/api/users/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        photoURL: user.photoURL,
      }),
    });
  } catch (error) {
    console.error('User sync failed:', error);
  }
}
