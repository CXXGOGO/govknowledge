import React, { useState, useEffect } from 'react';
import { Login } from './components/Login';
import { Dashboard } from './components/Dashboard';
import { AuthSession } from './types';

const AUTH_KEY = 'gov_knowledge_auth_session';
const SESSION_DURATION = 30 * 24 * 60 * 60 * 1000; // 30 Days in ms

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check local storage for existing session
    const storedSession = localStorage.getItem(AUTH_KEY);
    if (storedSession) {
      try {
        const session: AuthSession = JSON.parse(storedSession);
        const now = Date.now();
        if (session.isAuthenticated && session.expiry > now) {
          setIsAuthenticated(true);
        } else {
          // Expired
          localStorage.removeItem(AUTH_KEY);
        }
      } catch (e) {
        localStorage.removeItem(AUTH_KEY);
      }
    }
    setLoading(false);
  }, []);

  const handleLogin = () => {
    const session: AuthSession = {
      isAuthenticated: true,
      expiry: Date.now() + SESSION_DURATION
    };
    localStorage.setItem(AUTH_KEY, JSON.stringify(session));
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    localStorage.removeItem(AUTH_KEY);
    setIsAuthenticated(false);
  };

  if (loading) {
    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50">
            <div className="animate-pulse flex flex-col items-center">
                <div className="h-4 w-48 bg-slate-200 rounded mb-4"></div>
                <div className="h-8 w-12 bg-slate-200 rounded-full"></div>
            </div>
        </div>
    );
  }

  return (
    <>
      {isAuthenticated ? (
        <Dashboard onLogout={handleLogout} />
      ) : (
        <Login onLogin={handleLogin} />
      )}
    </>
  );
};

export default App;