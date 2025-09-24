// src/hooks/useAuth.ts
import React, { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { storage } from '@/utils/storage';

export type UserRole = 'inspector' | 'supervisor' | 'admin';

export interface User {
  id: string;
  name: string;
  pin: string;
  role: UserRole;
  department: string;
  isActive: boolean;
  createdAt: string;
  lastLogin?: string;
  permissions: {
    canCreateInspections: boolean;
    canApproveInspections: boolean;
    canViewAnalytics: boolean;
    canManageUsers: boolean;
    canExportReports: boolean;
    canViewAuditTrail: boolean;
  };
}

export interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (pin: string) => Promise<boolean>;
  logout: () => void;
  hasPermission: (permission: keyof User['permissions']) => boolean;
  isRole: (role: UserRole) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Default users for demo purposes
const defaultUsers: User[] = [
  {
    id: '1',
    name: 'Admin User',
    pin: '1234',
    role: 'admin',
    department: 'Administration',
    isActive: true,
    createdAt: new Date().toISOString(),
    permissions: {
      canCreateInspections: true,
      canApproveInspections: true,
      canViewAnalytics: true,
      canManageUsers: true,
      canExportReports: true,
      canViewAuditTrail: true,
    },
  },
  {
    id: '2',
    name: 'Supervisor Demo',
    pin: '5678',
    role: 'supervisor',
    department: 'Safety & Compliance',
    isActive: true,
    createdAt: new Date().toISOString(),
    permissions: {
      canCreateInspections: true,
      canApproveInspections: true,
      canViewAnalytics: true,
      canManageUsers: false,
      canExportReports: true,
      canViewAuditTrail: true,
    },
  },
  {
    id: '3',
    name: 'Inspector Demo',
    pin: '9999',
    role: 'inspector',
    department: 'Operations',
    isActive: true,
    createdAt: new Date().toISOString(),
    permissions: {
      canCreateInspections: true,
      canApproveInspections: false,
      canViewAnalytics: false,
      canManageUsers: false,
      canExportReports: true,
      canViewAuditTrail: false,
    },
  },
];

export function AuthProvider({ children }: { children: ReactNode }): JSX.Element {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    // Initialize default users if not exists
    const existingUsers = storage.load('users', []);
    if (existingUsers.length === 0) {
      storage.save('users', defaultUsers);
    }

    // Check for existing session
    const sessionUser = storage.load('currentUser', null);
    if (sessionUser) {
      setUser(sessionUser);
      setIsAuthenticated(true);
    }
  }, []);

  const login = async (pin: string): Promise<boolean> => {
    try {
      const users = storage.load('users', defaultUsers) as User[];
      const foundUser = users.find((u) => u.pin === pin && u.isActive);

      if (foundUser) {
        // Update last login
        const updatedUser = { ...foundUser, lastLogin: new Date().toISOString() };
        const updatedUsers = users.map((u) => (u.id === foundUser.id ? updatedUser : u));
        storage.save('users', updatedUsers);

        // Set session
        storage.save('currentUser', updatedUser);
        setUser(updatedUser);
        setIsAuthenticated(true);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Login error:', error);
      return false;
    }
  };

  const logout = () => {
    storage.remove('currentUser');
    setUser(null);
    setIsAuthenticated(false);
  };

  const hasPermission = (permission: keyof User['permissions']): boolean => {
    return user?.permissions[permission] || false;
  };

  const isRole = (role: UserRole): boolean => {
    return user?.role === role;
  };

  const value: AuthContextType = {
    user,
    isAuthenticated,
    login,
    logout,
    hasPermission,
    isRole,
  };

  return React.createElement(AuthContext.Provider, { value }, children);
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

// Higher-order component for route protection
export function withAuth<P extends object>(
  Component: React.ComponentType<P>,
  requiredRole?: UserRole,
  requiredPermission?: keyof User['permissions'],
) {
  return function AuthenticatedComponent(props: P) {
    const { isAuthenticated, user, hasPermission, isRole } = useAuth();

    useEffect(() => {
      if (!isAuthenticated) {
        window.location.href = '/login';
        return;
      }

      if (requiredRole && !isRole(requiredRole)) {
        window.location.href = '/unauthorized';
        return;
      }

      if (requiredPermission && !hasPermission(requiredPermission)) {
        window.location.href = '/unauthorized';
        return;
      }
    }, [isAuthenticated, user, hasPermission, isRole]);

    if (!isAuthenticated) {
      return null;
    }

    if (requiredRole && !isRole(requiredRole)) {
      return null;
    }

    if (requiredPermission && !hasPermission(requiredPermission)) {
      return null;
    }

    return React.createElement(Component, props);
  };
}
