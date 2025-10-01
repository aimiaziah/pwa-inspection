// src/pages/api/devsecops/audit-trail.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { withRBAC } from '@/lib/rbac';
import { User } from '@/hooks/useAuth';
import { storage } from '@/utils/storage';

/**
 * GET /api/devsecops/audit-trail
 * Get audit trail logs with filtering
 */
async function handler(req: NextApiRequest, res: NextApiResponse, user: User) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { action, userId, startDate, endDate, page = '1', limit = '100' } = req.query;

  try {
    const auditLogs = storage.load('auditLogs', []) as any[];
    let filtered = auditLogs;

    // Filter by action
    if (action && typeof action === 'string') {
      filtered = filtered.filter((log) => log.action === action);
    }

    // Filter by user
    if (userId && typeof userId === 'string') {
      filtered = filtered.filter((log) => log.performedBy === userId);
    }

    // Filter by date range
    if (startDate && typeof startDate === 'string') {
      filtered = filtered.filter((log) => new Date(log.timestamp) >= new Date(startDate));
    }
    if (endDate && typeof endDate === 'string') {
      filtered = filtered.filter((log) => new Date(log.timestamp) <= new Date(endDate));
    }

    // Sort by timestamp (newest first)
    filtered.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    // Pagination
    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);
    const startIndex = (pageNum - 1) * limitNum;
    const endIndex = startIndex + limitNum;
    const paginated = filtered.slice(startIndex, endIndex);

    // Get unique actions for filtering
    const uniqueActions = [...new Set(auditLogs.map((log) => log.action))];

    return res.status(200).json({
      logs: paginated,
      total: filtered.length,
      page: pageNum,
      totalPages: Math.ceil(filtered.length / limitNum),
      availableActions: uniqueActions,
    });
  } catch (error) {
    console.error('Get audit trail error:', error);
    return res.status(500).json({ error: 'Failed to fetch audit trail' });
  }
}

export default withRBAC(handler, {
  requiredRole: 'devsecops',
  requiredPermission: 'canViewAuditTrail',
});
