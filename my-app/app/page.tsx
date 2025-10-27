'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Dashboard from './views/Dashboard';
import AuthView from './views/AuthView';
import HomePage from './views/HomePage';
import { Users, User, LogIn, UserPlus } from 'lucide-react';

type ViewType = 'home' | 'auth' | 'dashboard' | 'review' | 'rating' | 'report';
type RoleType = 'student' | 'instructor';

const MOCK_UID = 'mock_user_1234567890';

export default function Page() {
  const [user, setUser] = useState<{ id: string; email: string; role: RoleType }>({
    id: MOCK_UID,
    email: '',
    role: 'student',
  });

  const [view, setView] = useState<ViewType>('home');
  const [isLoading, setIsLoading] = useState(false);
  const [projects, setProjects] = useState<any[]>([]);
  const [currentProjectId, setCurrentProjectId] = useState<string | null>(null);

  const currentProject = useMemo(
    () => projects.find((p) => p.id === currentProjectId),
    [projects, currentProjectId]
  );

  // --- Logout ---
  const handleLogout = () => {
    setUser({ id: '', email: '', role: 'student' });
    setCurrentProjectId(null);
    setProjects([]);
    localStorage.removeItem('peerEvalUser');
    setView('home');
  };

  // --- Password Reset ---
  const handlePasswordReset = async (email: string) => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/auth/reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();
      if (!res.ok) {
        alert(data.error || 'Failed to request password reset.');
        return;
      }
      alert(`${data.message}\n(Check console for preview URL)`);
    } catch (err) {
      console.error(err);
      alert('Something went wrong. Check console.');
    } finally {
      setIsLoading(false);
    }
  };

  // --- Restore logged-in user on refresh ---
  useEffect(() => {
    const savedUser = localStorage.getItem('peerEvalUser');
    if (savedUser) {
      try {
        const parsed = JSON.parse(savedUser);
        if (parsed.id && parsed.email && parsed.role) {
          setUser(parsed);
          setView('dashboard');
        }
      } catch {
        // Old format (just userId string)
        setUser((prev) => ({ ...prev, id: savedUser }));
        setView('dashboard');
      }
    }
  }, []);

  // inside your root Page component (useEffect area)
useEffect(() => {
  const loadStoredUser = () => {
    const saved = localStorage.getItem('peerEvalUser');
    if (!saved) return;
    try {
      const parsed = JSON.parse(saved);
      if (parsed && parsed.id) {
        setUser(parsed);      // full object with id, email, role
        setView('dashboard');
      }
    } catch (err) {
      // older format: a raw id string — keep backward compatibility
      setUser(prev => ({ ...prev, id: saved }));
      setView('dashboard');
    }
  };

  loadStoredUser();

  // listen for changes from other tabs or explicit updates
  const onStorage = (e: StorageEvent) => {
    if (e.key === 'peerEvalUser') {
      loadStoredUser();
    }
  };
  window.addEventListener('storage', onStorage);
  return () => window.removeEventListener('storage', onStorage);
}, []);


  // --- Header ---
  const Header = () => (
    <header className="flex justify-between items-center p-4 bg-white border-b shadow-md sticky top-0 z-10">
      <h1
        className="text-3xl font-bold text-indigo-700 cursor-pointer"
        onClick={() => setView(user.id ? 'dashboard' : 'home')}
      >
        PeerEval
      </h1>
      {user.id ? (
        <div className="flex items-center space-x-4">
          <div className="flex items-center text-sm font-medium text-gray-600 rounded-full bg-indigo-100 px-3 py-1">
            <User className="w-4 h-4 mr-2" />
            UID: {user.id.substring(0, 8)}...
          </div>
          <button
            onClick={() => {
              setCurrentProjectId(null);
              setView('dashboard');
            }}
            className="p-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-full transition flex items-center"
          >
            <Users className="w-5 h-5 inline mr-1" /> Dashboard
          </button>
          <button
            onClick={handleLogout}
            className="flex items-center text-sm font-medium text-red-600 hover:text-red-800 transition"
          >
            <LogIn className="w-5 h-5 mr-1" /> Logout
          </button>
        </div>
      ) : (
        <button
          onClick={() => setView('auth')}
          className="flex items-center text-sm font-medium text-indigo-600 bg-indigo-100 px-4 py-2 rounded-lg hover:bg-indigo-200 transition shadow-sm"
        >
          <UserPlus className="w-5 h-5 mr-1" /> Get Started
        </button>
      )}
    </header>
  );

  // --- Main Render ---
  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      <Header />
      <main>
        {view === 'home' && (
          <HomePage setView={setView} />
        )}
        {view === 'auth' && (
          <AuthView
            handlePasswordReset={handlePasswordReset}
            setView={setView}
            setIsLoading={setIsLoading}
            setUser={setUser}
          />
        )}
        {view === 'dashboard' && <Dashboard user={user} />}
      </main>
    </div>
  );
}
