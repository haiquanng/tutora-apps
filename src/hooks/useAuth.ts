import { useContext } from 'react';
import { AuthContext } from './authContext';
import type { AuthValue } from './authContext';

export const useAuth = (): AuthValue => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth phải nằm trong <AuthProvider>');
  return context;
};
