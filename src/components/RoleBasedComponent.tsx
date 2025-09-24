// src/components/RoleBasedComponent.tsx
import React from 'react';
import { useAuth, UserRole } from '@/hooks/useAuth';

interface RoleBasedComponentProps {
  children: React.ReactNode;
  roles?: UserRole[];
  permissions?: string[];
  fallback?: React.ReactNode;
}

const RoleBasedComponent: React.FC<RoleBasedComponentProps> = ({
  children,
  roles,
  permissions,
  fallback = null,
}) => {
  const { user, hasPermission, isRole } = useAuth();

  if (!user) {
    return <>{fallback}</>;
  }

  // Check role requirements
  if (roles && roles.length > 0) {
    const hasRequiredRole = roles.some((role) => isRole(role));
    if (!hasRequiredRole) {
      return <>{fallback}</>;
    }
  }

  // Check permission requirements
  if (permissions && permissions.length > 0) {
    const hasRequiredPermission = permissions.every((permission) =>
      hasPermission(permission as any),
    );
    if (!hasRequiredPermission) {
      return <>{fallback}</>;
    }
  }

  return <>{children}</>;
};

export default RoleBasedComponent;
