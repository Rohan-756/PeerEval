'use client';

import React from 'react';
import { Users, User, LogIn, UserPlus } from 'lucide-react';
import { useRouter, usePathname } from 'next/navigation';
import { UserType } from './types';

interface HeaderProps {
  user?: UserType | null;
  onLogout?: () => void;
}

const Header: React.FC<HeaderProps> = ({ user: propUser, onLogout }) => {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = React.useState<UserType | null>(propUser ?? null);

  // ✅ Load user from sessionStorage if not passed as prop
  React.useEffect(() => {
    if (!propUser) {
      try {
        const storedUser = sessionStorage.getItem('peerEvalUser');
        if (storedUser) {
          const parsedUser = JSON.parse(storedUser);
          setUser(parsedUser);
        }
      } catch (err) {
        console.error('Failed to parse user from sessionStorage:', err);
      }
    }
  }, [propUser]);

  // ✅ Handle logo click navigation
  const handleLogoClick = () => {
    if (user?.id) router.push('/dashboard');
    else router.push('/');
  };

  // ✅ Safe logout fallback
  const handleLogout = () => {
    try {
      if (onLogout) {
        onLogout(); // Use custom handler if passed
      } else {
        sessionStorage.clear();
        alert('You have been logged out.');
        router.push('/');
      }
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  // ✅ Only show "Dashboard" button when NOT on '/' or '/dashboard'
  const showDashboardButton = user?.id && !['/', '/dashboard'].includes(pathname);
  // JSX part
  return (
    <header className="flex justify-between items-center p-4 bg-white border-b shadow-md sticky top-0 z-10">
      {/* --- App Logo --- */}
      <h1
        onClick={handleLogoClick}
        className="text-3xl font-bold text-indigo-700 cursor-pointer"
      >
        PeerEval
      </h1>

      {/* --- Right side actions --- */}
      {user?.id ? (
        <div className="flex items-center space-x-4">
          {/* UID Badge */}
          <div className="flex items-center text-sm font-medium text-gray-600 rounded-full bg-indigo-100 px-3 py-1">
            <User className="w-4 h-4 mr-2" />
            UID: {user.id.substring(0, 8)}...
          </div>

          {/* ✅ Dashboard Button (conditional) */}
          {showDashboardButton && (
            <button
              onClick={() => router.push('/dashboard')}
              className="p-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-full transition flex items-center"
            >
              <Users className="w-5 h-5 inline mr-1" /> Dashboard
            </button>
          )}

          {/* Logout Button */}
          <button
            onClick={handleLogout}
            className="flex items-center text-sm font-medium text-red-600 hover:text-red-800 transition"
          >
            <LogIn className="w-5 h-5 mr-1" /> Logout
          </button>
        </div>
      ) : (
        // --- Guest view ---
        <button
          onClick={() => router.push('/auth')}
          className="flex items-center text-sm font-medium text-indigo-600 bg-indigo-100 px-4 py-2 rounded-lg hover:bg-indigo-200 transition shadow-sm"
        >
          <UserPlus className="w-5 h-5 mr-1" /> Get Started
        </button>
      )}
    </header>
  );
};

export default Header;
