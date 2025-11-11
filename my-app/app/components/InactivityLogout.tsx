'use client';

import { useInactivityLogout } from '../hooks/useInactivityLogout';

/**
 * Component that handles automatic logout after inactivity
 * Should be included in the layout to work across all pages
 */
export default function InactivityLogout() {
  useInactivityLogout(30); // 30 minutes
  return null; // This component doesn't render anything
}

