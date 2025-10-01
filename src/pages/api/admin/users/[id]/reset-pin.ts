// src/pages/api/admin/users/[id]/reset-pin.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { withRBAC } from '@/lib/rbac';
import { User } from '@/hooks/useAuth';
import { storage } from '@/utils/storage';
import { generateSecurePIN, hashPIN } from '@/utils/auth';

async function handler(req: NextApiRequest, res: NextApiResponse, adminUser: User) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { id } = req.query;
  const { reason } = req.body;

  if (!id || typeof id !== 'string') {
    return res.status(400).json({ error: 'Invalid user ID' });
  }

  try {
    const users = storage.load('users', []) as User[];
    const userIndex = users.findIndex((u) => u.id === id);

    if (userIndex === -1) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Generate new PIN
    const newPIN = generateSecurePIN();
    const hashedPIN = hashPIN(newPIN);

    // Update user PIN
    users[userIndex].pin = hashedPIN;
    storage.save('users', users);

    // Log PIN reset
    logAuditEvent({
      action: 'PIN_RESET',
      performedBy: adminUser.id,
      performedByName: adminUser.name,
      targetUserId: id,
      targetUserName: users[userIndex].name,
      details: { reason: reason || 'No reason provided' },
      timestamp: new Date().toISOString(),
    });

    return res.status(200).json({
      message: 'PIN reset successfully',
      tempPIN: newPIN,
      user: { ...users[userIndex], pin: undefined },
    });
  } catch (error) {
    console.error('Reset PIN error:', error);
    return res.status(500).json({ error: 'Failed to reset PIN' });
  }
}

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
