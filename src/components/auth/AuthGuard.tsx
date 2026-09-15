'use client';

import React from 'react';

interface AuthGuardProps {
  children: React.ReactNode;
  allowedRoles?: string[];
}

/**
 * AuthGuard - Disabled authentication requirement as per user directive.
 * Directly renders children without authentication checks, role checks, or redirects.
 */
export const AuthGuard: React.FC<AuthGuardProps> = ({ children }) => {
  return <>{children}</>;
};
