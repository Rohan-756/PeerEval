'use client';

import { useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';

/**
 * Custom hook to handle automatic logout after 30 minutes of inactivity
 * Tracks user activity (mouse, keyboard, touch, scroll) and resets timer on activity
 */
export function useInactivityLogout(timeoutMinutes: number = 30) {
  const router = useRouter();
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const timeoutMs = timeoutMinutes * 60 * 1000; // Convert minutes to milliseconds

  const logout = useCallback(() => {
    // Clear session storage
    sessionStorage.removeItem('peerEvalUser');
    
    // Redirect to auth page
    router.push('/auth');
    
    // Optional: Show a message (you can customize this)
    console.log('You have been logged out due to inactivity.');
  }, [router]);

  const resetTimer = useCallback(() => {
    // Clear existing timer
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Set new timer
    timeoutRef.current = setTimeout(() => {
      logout();
    }, timeoutMs);
  }, [logout, timeoutMs]);

  useEffect(() => {
    // Only set up inactivity tracking if user is logged in
    const user = sessionStorage.getItem('peerEvalUser');
    if (!user) {
      return;
    }

    // Events that indicate user activity
    const events = [
      'mousedown',
      'mousemove',
      'keypress',
      'scroll',
      'touchstart',
      'click',
      'keydown',
    ];

    // Initialize timer
    resetTimer();

    // Add event listeners
    events.forEach((event) => {
      window.addEventListener(event, resetTimer, true);
    });

    // Cleanup function
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      events.forEach((event) => {
        window.removeEventListener(event, resetTimer, true);
      });
    };
  }, [resetTimer]);

  return { resetTimer };
}

