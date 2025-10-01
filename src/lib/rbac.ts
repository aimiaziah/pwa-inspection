// src/lib/rbac.ts - Role-Based Access Control utilities
import { NextApiRequest, NextApiResponse } from 'next';
import { User, UserRole } from '@/hooks/useAuth';
import { storage } from '@/utils/storage';

export interface RBACOptions {
  requiredRole?: UserRole | UserRole[];
  requiredPermission?: keyof User['permissions'] | Array<keyof User['permissions']>;
  requireAll?: boolean; // If true, user must have ALL permissions. If false, user needs ANY permission
}

/**
 * RBAC Middleware for API routes
 * Validates user authentication and authorization
 */
export function withRBAC(
  handler: (req: NextApiRequest, res: NextApiResponse, user: User) => Promise<void> | void,
  options: RBACOptions = {},
) {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    try {
      // 1. Extract auth token from cookies or headers
      const authToken =
        req.cookies['auth-token'] || req.headers.authorization?.replace('Bearer ', '');

      if (!authToken) {
        return res.status(401).json({ error: 'Unauthorized - No auth token provided' });
      }

      // 2. Validate token and get user
      const user = validateAuthToken(authToken);
      if (!user) {
        return res.status(401).json({ error: 'Unauthorized - Invalid or expired token' });
      }

      // 3. Check if user is active
      if (!user.isActive) {
        return res.status(403).json({ error: 'Forbidden - User account is deactivated' });
      }

      // 4. Check role-based access
      if (options.requiredRole) {
        const roles = Array.isArray(options.requiredRole)
          ? options.requiredRole
          : [options.requiredRole];
        if (!roles.includes(user.role)) {
          return res.status(403).json({
            error: 'Forbidden - Insufficient role permissions',
            required: roles,
            current: user.role,
          });
        }
      }

      // 5. Check permission-based access
      if (options.requiredPermission) {
        const permissions = Array.isArray(options.requiredPermission)
          ? options.requiredPermission
          : [options.requiredPermission];

        const hasPermission = options.requireAll
          ? permissions.every((perm) => user.permissions[perm])
          : permissions.some((perm) => user.permissions[perm]);

        if (!hasPermission) {
          return res.status(403).json({
            error: 'Forbidden - Insufficient permissions',
            required: permissions,
          });
        }
      }

      // 6. Log access for audit trail
      logAccess(user, req);

      // 7. Call the actual handler with authenticated user
      return await handler(req, res, user);
    } catch (error) {
      console.error('RBAC Middleware Error:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  };
}

/**
 * Validate auth token and return user
 */
function validateAuthToken(token: string): User | null {
  try {
    // For demo: token is just the user ID
    // In production: validate JWT or session token
    const users = storage.load('users', []) as User[];
    const user = users.find((u) => u.id === token);
    return user || null;
  } catch (error) {
    console.error('Token validation error:', error);
    return null;
  }
}

/**
 * Log access for audit trail
 */
function logAccess(user: User, req: NextApiRequest): void {
  const accessLog = {
    userId: user.id,
    userName: user.name,
    role: user.role,
    method: req.method,
    path: req.url,
    timestamp: new Date().toISOString(),
    ip: req.headers['x-forwarded-for'] || req.socket.remoteAddress,
    userAgent: req.headers['user-agent'],
  };

  const logs = storage.load('accessLogs', []);
  logs.push(accessLog);

  // Keep only last 10000 logs
  if (logs.length > 10000) {
    logs.shift();
  }

  storage.save('accessLogs', logs);
}

/**
 * Check if user has specific permission
 */
export function checkPermission(user: User, permission: keyof User['permissions']): boolean {
  return user.permissions[permission] || false;
}

/**
 * Check if user has specific role
 */
export function checkRole(user: User, role: UserRole | UserRole[]): boolean {
  const roles = Array.isArray(role) ? role : [role];
  return roles.includes(user.role);
}

/**
 * Get role permissions template
 */
export function getRolePermissions(role: UserRole): User['permissions'] {
  switch (role) {
    case 'admin':
      return {
        // Admin permissions
        canManageUsers: true,
        canManageRoles: true,
        canManageForms: true,
        canSetNotifications: true,
        canManageSystem: true,
        canBackupRestore: true,

        // Inspector permissions (view-only)
        canCreateInspections: false,
        canEditInspections: false,
        canViewInspections: true,
        canViewAnalytics: true,
        canViewGoogleDriveStatus: true,
        canAddDigitalSignature: false,
        canExportReports: true,

        // DevSecOps permissions (view-only)
        canViewDevSecOpsDashboard: false,
        canViewSecurityLogs: true,
        canViewSystemErrors: true,
        canTrackDataBreaches: true,
        canMonitorUpdates: true,
        canViewAuditTrail: true,
      };

    case 'inspector':
      return {
        // Admin permissions
        canManageUsers: false,
        canManageRoles: false,
        canManageForms: false,
        canSetNotifications: false,
        canManageSystem: false,
        canBackupRestore: false,

        // Inspector permissions
        canCreateInspections: true,
        canEditInspections: true,
        canViewInspections: true,
        canViewAnalytics: true,
        canViewGoogleDriveStatus: true,
        canAddDigitalSignature: true,
        canExportReports: true,

        // DevSecOps permissions
        canViewDevSecOpsDashboard: false,
        canViewSecurityLogs: false,
        canViewSystemErrors: false,
        canTrackDataBreaches: false,
        canMonitorUpdates: false,
        canViewAuditTrail: false,
      };

    case 'devsecops':
      return {
        // Admin permissions
        canManageUsers: false,
        canManageRoles: false,
        canManageForms: false,
        canSetNotifications: false,
        canManageSystem: false,
        canBackupRestore: false,

        // Inspector permissions (limited view)
        canCreateInspections: false,
        canEditInspections: false,
        canViewInspections: true,
        canViewAnalytics: false,
        canViewGoogleDriveStatus: false,
        canAddDigitalSignature: false,
        canExportReports: false,

        // DevSecOps permissions
        canViewDevSecOpsDashboard: true,
        canViewSecurityLogs: true,
        canViewSystemErrors: true,
        canTrackDataBreaches: true,
        canMonitorUpdates: true,
        canViewAuditTrail: true,
      };

    default:
      // Default: no permissions
      return {
        canManageUsers: false,
        canManageRoles: false,
        canManageForms: false,
        canSetNotifications: false,
        canManageSystem: false,
        canBackupRestore: false,
        canCreateInspections: false,
        canEditInspections: false,
        canViewInspections: false,
        canViewAnalytics: false,
        canViewGoogleDriveStatus: false,
        canAddDigitalSignature: false,
        canExportReports: false,
        canViewDevSecOpsDashboard: false,
        canViewSecurityLogs: false,
        canViewSystemErrors: false,
        canTrackDataBreaches: false,
        canMonitorUpdates: false,
        canViewAuditTrail: false,
      };
  }
}
