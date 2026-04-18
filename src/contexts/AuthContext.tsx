import { createContext, useContext } from 'react';
import type { User } from 'firebase/auth';

interface AuthContextValue {
  user: User;
  signOut: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextValue | null>(null);

export function useAuthContext() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuthContext must be used inside AuthContext');
  return ctx;
}
