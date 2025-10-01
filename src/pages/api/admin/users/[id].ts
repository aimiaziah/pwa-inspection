// src/pages/api/admin/users/[id].ts
import { NextApiRequest, NextApiResponse } from 'next';
import { withRBAC, getRolePermissions } from '@/lib/rbac';
import { User } from '@/hooks/useAuth';
import { storage } from '@/utils/storage';
import { generateSecurePIN, hashPIN } from '@/utils/auth';

async function handler(req: NextApiRequest, res: NextApiResponse, user: User) {
  const { id } = req.query;

  if (!id || typeof id !== 'string') {
    return res.status(400).json({ error: 'Invalid user ID' });
  }

  if (req.method === 'GET') {
    return getUser(req, res, id);
  }
  if (req.method === 'PUT') {
    return updateUser(req, res, id, user);
  }
  if (req.method === 'DELETE') {
    return deactivateUser(req, res, id, user);
  }
  return res.status(405).json({ error: 'Method not allowed' });
}

// GET /api/admin/users/[id] - Get single user
async function getUser(req: NextApiRequest, res: NextApiResponse, userId: string) {
  try {
    const users = storage.load('users', []) as User[];
    const user = users.find((u) => u.id === userId);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Remove sensitive data
    const sanitizedUser = { ...user, pin: undefined };

    return res.status(200).json({ user: sanitizedUser });
  } catch (error) {
    console.error('Get user error:', error);
    return res.status(500).json({ error: 'Failed to fetch user' });
  }
}

// PUT /api/admin/users/[id] - Update user
async function updateUser(
  req: NextApiRequest,
  res: NextApiResponse,
  userId: string,
  adminUser: User,
) {
  const { name, role, department, isActive, permissions } = req.body;

  try {
    const users = storage.load('users', []) as User[];
    const userIndex = users.findIndex((u) => u.id === userId);

    if (userIndex === -1) {
      return res.status(404).json({ error: 'User not found' });
    }

    const existingUser = users[userIndex];
    const updates: any = {};

    // Update name
    if (name && name !== existingUser.name) {
      updates.name = name;
      existingUser.name = name;
    }

    // Update role
    if (role && role !== existingUser.role) {
      if (!['admin', 'inspector', 'devsecops'].includes(role)) {
        return res.status(400).json({ error: 'Invalid role' });
      }
      updates.role = role;
      existingUser.role = role;
      // Update permissions based on new role
      existingUser.permissions = getRolePermissions(role);
    }

    // Update department
    if (department && department !== existingUser.department) {
      updates.department = department;
      existingUser.department = department;
    }

    // Update active status
    if (typeof isActive === 'boolean' && isActive !== existingUser.isActive) {
      updates.isActive = isActive;
      existingUser.isActive = isActive;
    }

    // Update custom permissions (if provided and role hasn't changed)
    if (permissions && !updates.role) {
      updates.permissions = permissions;
      existingUser.permissions = { ...existingUser.permissions, ...permissions };
    }

    users[userIndex] = existingUser;
    storage.save('users', users);

    // Log update
    logAuditEvent({
      action: 'USER_UPDATED',
      performedBy: adminUser.id,
      performedByName: adminUser.name,
      targetUserId: userId,
      targetUserName: existingUser.name,
      details: updates,
      timestamp: new Date().toISOString(),
    });

    return res.status(200).json({
      user: { ...existingUser, pin: undefined },
      message: 'User updated successfully',
    });
  } catch (error) {
    console.error('Update user error:', error);
    return res.status(500).json({ error: 'Failed to update user' });
  }
}

// DELETE /api/admin/users/[id] - Deactivate user (soft delete)
async function deactivateUser(
  req: NextApiRequest,
  res: NextApiResponse,
  userId: string,
  adminUser: User,
) {
  try {
    // Prevent self-deactivation
    if (userId === adminUser.id) {
      return res.status(400).json({ error: 'Cannot deactivate your own account' });
    }

    const users = storage.load('users', []) as User[];
    const userIndex = users.findIndex((u) => u.id === userId);

    if (userIndex === -1) {
      return res.status(404).json({ error: 'User not found' });
    }

    users[userIndex].isActive = false;
    storage.save('users', users);

    // Log deactivation
    logAuditEvent({
      action: 'USER_DEACTIVATED',
      performedBy: adminUser.id,
      performedByName: adminUser.name,
      targetUserId: userId,
      targetUserName: users[userIndex].name,
      timestamp: new Date().toISOString(),
    });

    return res.status(200).json({
      message: 'User deactivated successfully',
      user: { ...users[userIndex], pin: undefined },
    });
  } catch (error) {
    console.error('Deactivate user error:', error);
    return res.status(500).json({ error: 'Failed to deactivate user' });
  }
}

// Helper function to log audit events
function logAuditEvent(event: any) {
  const auditLogs = storage.load('auditLogs', []);
  auditLogs.push(event);

  if (auditLogs.length > 50000) {
    auditLogs.splice(0, auditLogs.length - 50000);
  }

  storage.save('auditLogs', auditLogs);
}

export default withRBAC(handler, {
  requiredRole: 'admin',
  requiredPermission: 'canManageUsers',
});
