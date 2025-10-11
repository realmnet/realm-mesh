'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface AuthContextType {
  isAuthenticated: boolean;
  apiKey: string | null;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>({
  isAuthenticated: false,
  apiKey: null,
  logout: () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [apiKey, setApiKey] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    // Check authentication status on mount
    const storedApiKey = sessionStorage.getItem('realmMeshApiKey');
    const authStatus = sessionStorage.getItem('isAuthenticated');

    if (authStatus === 'true' && storedApiKey) {
      setIsAuthenticated(true);
      setApiKey(storedApiKey);
    }
  }, []);

  const logout = () => {
    // Clear session storage
    sessionStorage.removeItem('realmMeshApiKey');
    sessionStorage.removeItem('isAuthenticated');

    // Clear cookie
    document.cookie = 'isAuthenticated=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;';

    // Update state
    setIsAuthenticated(false);
    setApiKey(null);

    // Redirect to login
    router.push('/login');
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, apiKey, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};