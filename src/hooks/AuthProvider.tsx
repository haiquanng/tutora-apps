import { useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { AuthContext } from './authContext';
import type { AuthValue } from './authContext';
import { consumeSessionFromUrl, fetchCurrentUser, logout, redirectToLogin } from '../services/auth.service';
import type { AuthUser } from '../services/auth.service';

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    // Vừa từ trang login quay về -> lấy token trong fragment TRƯỚC khi hỏi BE.
    consumeSessionFromUrl();
    fetchCurrentUser()
      .then((current) => {
        if (!cancelled) setUser(current);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const value = useMemo<AuthValue>(() => ({ user, isLoading, login: redirectToLogin, logout }), [user, isLoading]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
