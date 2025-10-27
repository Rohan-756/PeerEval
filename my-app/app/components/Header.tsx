// src/components/Header.tsx
'use client';

import React from 'react';
import { Users, User, LogIn, UserPlus } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { UserType } from './types';

interface HeaderProps {
  user: UserType | null;
  onLogout: () => void;
}

const Header: React.FC<HeaderProps> = ({ user, onLogout }) => {
  const router = useRouter();

  const handleLogoClick = () => {
    if (user?.id) router.push('/dashboard');
    else router.push('/');
  };

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
          <div className="flex items-center text-sm font-medium text-gray-600 rounded-full bg-indigo-100 px-3 py-1">
            <User className="w-4 h-4 mr-2" />
            UID: {user.id.substring(0, 8)}...
          </div>

          <button
            onClick={() => router.push('/dashboard')}
            className="p-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-full transition flex items-center"
          >
            <Users className="w-5 h-5 inline mr-1" /> Dashboard
          </button>

          <button
            onClick={onLogout}
            className="flex items-center text-sm font-medium text-red-600 hover:text-red-800 transition"
          >
            <LogIn className="w-5 h-5 mr-1" /> Logout
          </button>
        </div>
      ) : (
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
