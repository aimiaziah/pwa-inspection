// src/pages/api/devsecops/security-logs.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { withRBAC } from '@/lib/rbac';
import { User } from '@/hooks/useAuth';
import { storage } from '@/utils/storage';
import { SecurityEvent } from './dashboard';

/**
 * GET /api/devsecops/security-logs
 * Get security logs with filtering
 */
async function handler(req: NextApiRequest, res: NextApiResponse, user: User) {
  if (req.method === 'GET') {
    return getSecurityLogs(req, res);
  }
  if (req.method === 'POST') {
    return createSecurityEvent(req, res, user);
  }
  return res.status(405).json({ error: 'Method not allowed' });
}

// GET /api/devsecops/security-logs
async function getSecurityLogs(req: NextApiRequest, res: NextApiResponse) {
  const { type, severity, resolved, startDate, endDate, page = '1', limit = '50' } = req.query;

  try {
    const securityEvents = storage.load('securityEvents', []) as SecurityEvent[];
    let filtered = securityEvents;

    // Filter by type
    if (type && typeof type === 'string') {
      filtered = filtered.filter((e) => e.type === type);
    }

    // Filter by severity
    if (severity && typeof severity === 'string') {
      filtered = filtered.filter((e) => e.severity === severity);
    }

    // Filter by resolved status
    if (resolved !== undefined) {
      const isResolved = resolved === 'true';
      filtered = filtered.filter((e) => e.resolved === isResolved);
    }

    // Filter by date range
    if (startDate && typeof startDate === 'string') {
      filtered = filtered.filter((e) => new Date(e.timestamp) >= new Date(startDate));
    }
    if (endDate && typeof endDate === 'string') {
      filtered = filtered.filter((e) => new Date(e.timestamp) <= new Date(endDate));
    }

    // Sort by timestamp (newest first)
    filtered.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    // Pagination
    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);
    const startIndex = (pageNum - 1) * limitNum;
    const endIndex = startIndex + limitNum;
    const paginated = filtered.slice(startIndex, endIndex);

    return res.status(200).json({
      events: paginated,
      total: filtered.length,
      page: pageNum,
      totalPages: Math.ceil(filtered.length / limitNum),
    });
  } catch (error) {
    console.error('Get security logs error:', error);
    return res.status(500).json({ error: 'Failed to fetch security logs' });
  }
}

// POST /api/devsecops/security-logs
async function createSecurityEvent(req: NextApiRequest, res: NextApiResponse, user: User) {
  const { type, severity, title, description, affectedUser, affectedResource, ipAddress } =
    req.body;

  try {
    if (!type || !severity || !title || !description) {
      return res.status(400).json({
        error: 'Missing required fields',
        required: ['type', 'severity', 'title', 'description'],
      });
    }

    const validTypes = [
      'error',
      'data_breach',
      'update',
      'access_violation',
      'suspicious_activity',
    ];
    if (!validTypes.includes(type)) {
      return res.status(400).json({ error: 'Invalid type', validTypes });
    }

    const validSeverities = ['low', 'medium', 'high', 'critical'];
    if (!validSeverities.includes(severity)) {
      return res.status(400).json({ error: 'Invalid severity', validSeverities });
    }

    const newEvent: SecurityEvent = {
      id: Date.now().toString(),
      type,
      severity,
      title,
      description,
      timestamp: new Date().toISOString(),
      affectedUser,
      affectedResource,
      ipAddress,
      resolved: false,
    };

    const securityEvents = storage.load('securityEvents', []) as SecurityEvent[];
    securityEvents.push(newEvent);
    storage.save('securityEvents', securityEvents);

    // Log to audit trail
    logAuditEvent({
      action: 'SECURITY_EVENT_CREATED',
      performedBy: user.id,
      performedByName: user.name,
      details: { eventId: newEvent.id, type, severity, title },
      timestamp: new Date().toISOString(),
    });

    return res.status(201).json({
      event: newEvent,
      message: 'Security event created successfully',
    });
  } catch (error) {
    console.error('Create security event error:', error);
    return res.status(500).json({ error: 'Failed to create security event' });
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
  requiredRole: 'devsecops',
  requiredPermission: 'canViewSecurityLogs',
});
