import { createContext } from 'react';
import type { AuthUser } from '../services/auth.service';

export interface AuthValue {
  user: AuthUser | null;
  /** Đang hỏi BE lần đầu -> tránh nháy nút "Đăng nhập" rồi đổi thành avatar. */
  isLoading: boolean;
  login: () => void;
  logout: () => Promise<void>;
}

/** Tách khỏi AuthProvider để file component chỉ export component (fast refresh). */
export const AuthContext = createContext<AuthValue | null>(null);
