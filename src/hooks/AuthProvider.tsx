import { useCallback, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { AuthContext } from './authContext';
import type { AuthValue } from './authContext';
import { consumeSessionFromUrl, fetchCurrentUser, logout } from '../services/auth.service';
import type { AuthUser } from '../services/auth.service';
import { LoginModal } from '../components/auth/LoginModal';

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setLoading] = useState(true);
  const [isLoginOpen, setLoginOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    // Link cũ còn gửi token qua fragment, đọc trước khi hỏi BE.
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

  // Modal giữ người dùng ở lại, câu đang gõ không mất.
  const login = useCallback(() => setLoginOpen(true), []);

  const value = useMemo<AuthValue>(() => ({ user, isLoading, login, logout }), [user, isLoading, login]);

  return (
    <AuthContext.Provider value={value}>
      {children}
      <LoginModal isOpen={isLoginOpen} onClose={() => setLoginOpen(false)} onSuccess={setUser} />
    </AuthContext.Provider>
  );
};
