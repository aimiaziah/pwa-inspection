// src/pages/api/devsecops/dashboard.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { withRBAC } from '@/lib/rbac';
import { User } from '@/hooks/useAuth';
import { storage } from '@/utils/storage';

export interface SecurityEvent {
  id: string;
  type: 'error' | 'data_breach' | 'update' | 'access_violation' | 'suspicious_activity';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  timestamp: string;
  affectedUser?: string;
  affectedResource?: string;
  ipAddress?: string;
  resolved: boolean;
  resolvedAt?: string;
  resolvedBy?: string;
}

/**
 * GET /api/devsecops/dashboard
 * Get DevSecOps monitoring dashboard data
 */
async function handler(req: NextApiRequest, res: NextApiResponse, user: User) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get security events
    const securityEvents = storage.load('securityEvents', []) as SecurityEvent[];
    const accessLogs = storage.load('accessLogs', []);
    const auditLogs = storage.load('auditLogs', []);
    const users = storage.load('users', []);

    // Calculate metrics
    const last24Hours = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const last7Days = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

    const recentSecurityEvents = securityEvents.filter((e) => e.timestamp >= last24Hours);
    const unresolvedEvents = securityEvents.filter((e) => !e.resolved);
    const criticalEvents = securityEvents.filter((e) => e.severity === 'critical' && !e.resolved);

    const recentAccessLogs = accessLogs.filter((log: any) => log.timestamp >= last24Hours);
    const recentAuditLogs = auditLogs.filter((log: any) => log.timestamp >= last7Days);

    // Active users in last 24 hours
    const activeUserIds = new Set(recentAccessLogs.map((log: any) => log.userId));
    const activeUsers = activeUserIds.size;

    // Failed login attempts (simulated - track from access logs)
    const failedLogins = recentAccessLogs.filter(
      (log: any) => log.method === 'POST' && log.path?.includes('/login') && log.status === 401,
    ).length;

    // System errors in last 24 hours
    const systemErrors = recentSecurityEvents.filter((e) => e.type === 'error').length;

    // Data breach incidents
    const dataBreaches = securityEvents.filter((e) => e.type === 'data_breach').length;

    // Recent updates
    const recentUpdates = auditLogs
      .filter((log: any) => log.timestamp >= last7Days)
      .sort((a: any, b: any) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 10);

    // Security score (0-100)
    const securityScore = calculateSecurityScore({
      criticalEvents: criticalEvents.length,
      unresolvedEvents: unresolvedEvents.length,
      failedLogins,
      systemErrors,
      dataBreaches,
    });

    const dashboardData = {
      summary: {
        securityScore,
        activeUsers,
        systemErrors,
        unresolvedEvents: unresolvedEvents.length,
        criticalEvents: criticalEvents.length,
        dataBreaches,
        failedLogins,
      },
      recentSecurityEvents: recentSecurityEvents.slice(0, 20),
      criticalEvents: criticalEvents.slice(0, 10),
      recentUpdates,
      systemHealth: {
        uptime: calculateUptime(),
        lastUpdate: new Date().toISOString(),
        activeConnections: activeUsers,
        totalUsers: users.length,
      },
      activityTrends: {
        accessLogsLast24h: recentAccessLogs.length,
        auditLogsLast7d: recentAuditLogs.length,
        averageResponseTime: '250ms', // Simulated
        errorRate: systemErrors > 0 ? (systemErrors / recentAccessLogs.length) * 100 : 0,
      },
    };

    return res.status(200).json(dashboardData);
  } catch (error) {
    console.error('DevSecOps dashboard error:', error);
    return res.status(500).json({ error: 'Failed to fetch dashboard data' });
  }
}

function calculateSecurityScore(metrics: {
  criticalEvents: number;
  unresolvedEvents: number;
  failedLogins: number;
  systemErrors: number;
  dataBreaches: number;
}): number {
  let score = 100;

  // Deduct points for security issues
  score -= metrics.criticalEvents * 10;
  score -= metrics.unresolvedEvents * 2;
  score -= metrics.failedLogins * 0.5;
  score -= metrics.systemErrors * 1;
  score -= metrics.dataBreaches * 20;

  return Math.max(0, Math.min(100, score));
}

function calculateUptime(): string {
  // Simulated uptime - in production, track actual server uptime
  return '99.9%';
}

export default withRBAC(handler, {
  requiredRole: 'devsecops',
  requiredPermission: 'canViewDevSecOpsDashboard',
});
