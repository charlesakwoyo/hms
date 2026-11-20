import { useCallback, useEffect, useState } from 'react';
import { apiClient } from '../services/apiClient';

export interface SessionUser {
  id: string;
  username: string;
  name: string;
  email: string;
  role: string;
  department: string;
  phone: string;
  mustChangePassword: boolean;
}

export type SessionState = 'checking' | 'signed-out' | 'signed-in';

export function useSession() {
  const [state, setState] = useState<SessionState>('checking');
  const [user, setUser] = useState<SessionUser | null>(null);

  useEffect(() => {
    apiClient
      .me()
      .then((json) => {
        setUser(json.user);
        setState(json.user.mustChangePassword ? 'signed-out' : 'signed-in');
      })
      .catch(() => setState('signed-out'));
    const onSignedOut = () => {
      setUser(null);
      setState('signed-out');
    };
    window.addEventListener('wisecare:signed-out', onSignedOut);
    return () => window.removeEventListener('wisecare:signed-out', onSignedOut);
  }, []);

  const signIn = useCallback((signedIn: SessionUser) => {
    setUser(signedIn);
    setState('signed-in');
  }, []);

  const signOut = useCallback(async () => {
    await apiClient.logout().catch(() => undefined);
    setUser(null);
    setState('signed-out');
  }, []);

  return { state, user, signIn, signOut };
}
