// src/pages/api/admin/users/index.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { withRBAC, getRolePermissions } from '@/lib/rbac';
import { User } from '@/hooks/useAuth';
import { storage } from '@/utils/storage';
import { generateSecurePIN, hashPIN } from '@/utils/auth';

async function handler(req: NextApiRequest, res: NextApiResponse, user: User) {
  if (req.method === 'GET') {
    return getUsers(req, res);
  }
  if (req.method === 'POST') {
    return createUser(req, res, user);
  }
  return res.status(405).json({ error: 'Method not allowed' });
}

// GET /api/admin/users - List all users with filters
async function getUsers(req: NextApiRequest, res: NextApiResponse) {
  const { role, status, search, page = '1', limit = '10' } = req.query;

  try {
    const users = storage.load('users', []) as User[];
    let filtered = users;

    // Filter by role
    if (role && typeof role === 'string') {
      filtered = filtered.filter((u) => u.role === role);
    }

    // Filter by status
    if (status && typeof status === 'string') {
      filtered = filtered.filter((u) => u.isActive === (status === 'active'));
    }

    // Search by name or department
    if (search && typeof search === 'string') {
      const searchLower = search.toLowerCase();
      filtered = filtered.filter(
        (u) =>
          u.name.toLowerCase().includes(searchLower) ||
          u.department?.toLowerCase().includes(searchLower),
      );
    }

    // Pagination
    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);
    const startIndex = (pageNum - 1) * limitNum;
    const endIndex = startIndex + limitNum;
    const paginated = filtered.slice(startIndex, endIndex);

    // Remove sensitive data
    const sanitizedUsers = paginated.map((u) => ({
      ...u,
      pin: undefined,
    }));

    return res.status(200).json({
      users: sanitizedUsers,
      total: filtered.length,
      page: pageNum,
      totalPages: Math.ceil(filtered.length / limitNum),
    });
  } catch (error) {
    console.error('Get users error:', error);
    return res.status(500).json({ error: 'Failed to fetch users' });
  }
}

// POST /api/admin/users - Create new user
async function createUser(req: NextApiRequest, res: NextApiResponse, adminUser: User) {
  const { name, role, department } = req.body;

  try {
    // Validate required fields
    if (!name || !role || !department) {
      return res.status(400).json({
        error: 'Missing required fields',
        required: ['name', 'role', 'department'],
      });
    }

    // Validate role
    if (!['admin', 'inspector', 'devsecops'].includes(role)) {
      return res.status(400).json({
        error: 'Invalid role',
        validRoles: ['admin', 'inspector', 'devsecops'],
      });
    }

    // Generate secure PIN
    const newPIN = generateSecurePIN();
    const hashedPIN = hashPIN(newPIN);

    // Get default permissions for role
    const permissions = getRolePermissions(role);

    const newUser: User = {
      id: Date.now().toString(),
      name,
      pin: hashedPIN,
      role,
      department,
      permissions,
      isActive: true,
      createdAt: new Date().toISOString(),
      lastLogin: undefined,
    };

    const users = storage.load('users', []) as User[];
    users.push(newUser);
    storage.save('users', users);

    // Log user creation
    logAuditEvent({
      action: 'USER_CREATED',
      performedBy: adminUser.id,
      performedByName: adminUser.name,
      targetUserId: newUser.id,
      targetUserName: newUser.name,
      details: { role: newUser.role, department: newUser.department },
      timestamp: new Date().toISOString(),
    });

    return res.status(201).json({
      user: { ...newUser, pin: undefined },
      tempPIN: newPIN, // Send PIN once for display
      message: 'User created successfully',
    });
  } catch (error) {
    console.error('Create user error:', error);
    return res.status(500).json({ error: 'Failed to create user' });
  }
}

// Helper function to log audit events
function logAuditEvent(event: any) {
  const auditLogs = storage.load('auditLogs', []);
  auditLogs.push(event);

  // Keep only last 50000 audit logs
  if (auditLogs.length > 50000) {
    auditLogs.splice(0, auditLogs.length - 50000);
  }

  storage.save('auditLogs', auditLogs);
}

// Export with RBAC protection - Only admins can manage users
export default withRBAC(handler, {
  requiredRole: 'admin',
  requiredPermission: 'canManageUsers',
});
