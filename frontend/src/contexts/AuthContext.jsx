import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [isLoading, setIsLoading] = useState(true);

  // Verify token on mount
  useEffect(() => {
    const verifyToken = async () => {
      const storedToken = localStorage.getItem('token');
      if (!storedToken) {
        setIsLoading(false);
        return;
      }

      try {
        const API_BASE_URL = import.meta.env.VITE_BACKEND_URL;
        if (!API_BASE_URL) throw new Error('VITE_BACKEND_URL is not defined.');
        
        const res = await fetch(`${API_BASE_URL}/api/auth/me`, {
          headers: { 'Authorization': `Bearer ${storedToken}` }
        });

        if (res.ok) {
          const data = await res.json();
          setUser(data.user);
          setToken(storedToken);
        } else {
          localStorage.removeItem('token');
          setToken(null);
        }
      } catch (err) {
        console.error('Token verification failed:', err);
        localStorage.removeItem('token');
        setToken(null);
      } finally {
        setIsLoading(false);
      }
    };

    verifyToken();
  }, []);

  const login = async (email, password) => {
    const API_BASE_URL = import.meta.env.VITE_BACKEND_URL;
    if (!API_BASE_URL) throw new Error('VITE_BACKEND_URL is not defined.');
    
    const res = await fetch(`${API_BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });

    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || 'Login failed');
    }

    const data = await res.json();
    localStorage.setItem('token', data.token);
    setToken(data.token);
    setUser(data.user);
  };

  const signup = async (email, password, displayName) => {
    const API_BASE_URL = import.meta.env.VITE_BACKEND_URL;
    if (!API_BASE_URL) throw new Error('VITE_BACKEND_URL is not defined.');
    
    const res = await fetch(`${API_BASE_URL}/api/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, name: displayName })
    });

    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || 'Signup failed');
    }

    const data = await res.json();
    localStorage.setItem('token', data.token);
    setToken(data.token);
    setUser(data.user);
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
  };

  const loginWithGoogle = () => {
    const API_BASE_URL = import.meta.env.VITE_BACKEND_URL;
    if (!API_BASE_URL) throw new Error('VITE_BACKEND_URL is not defined.');
    window.location.href = `${API_BASE_URL}/api/auth/google`;
  };

  const loginWithGitHub = () => {
    const API_BASE_URL = import.meta.env.VITE_BACKEND_URL;
    if (!API_BASE_URL) throw new Error('VITE_BACKEND_URL is not defined.');
    window.location.href = `${API_BASE_URL}/api/auth/github`;
  };

  return (
    <AuthContext.Provider value={{ user, token, isLoading, login, signup, logout, loginWithGoogle, loginWithGitHub }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
