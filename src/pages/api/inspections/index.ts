// src/pages/api/inspections/index.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { withRBAC } from '@/lib/rbac';
import { User } from '@/hooks/useAuth';
import { storage } from '@/utils/storage';

export interface InspectionSubmission {
  id: string;
  formType: string;
  formTemplateId: string;
  inspectorId: string;
  inspectorName: string;
  data: Record<string, any>;
  signature?: {
    dataUrl: string;
    timestamp: string;
    inspectorId: string;
    inspectorName: string;
  };
  status: 'draft' | 'submitted' | 'approved' | 'rejected';
  submittedAt?: string;
  createdAt: string;
  updatedAt: string;
  googleDriveExport?: {
    status: 'pending' | 'success' | 'failed';
    fileId?: string;
    exportedAt?: string;
    error?: string;
  };
}

async function handler(req: NextApiRequest, res: NextApiResponse, user: User) {
  if (req.method === 'GET') {
    return getInspections(req, res, user);
  }
  if (req.method === 'POST') {
    return createInspection(req, res, user);
  }
  return res.status(405).json({ error: 'Method not allowed' });
}

// GET /api/inspections
async function getInspections(req: NextApiRequest, res: NextApiResponse, user: User) {
  const { formType, status, startDate, endDate, page = '1', limit = '20' } = req.query;

  try {
    const inspections = storage.load('inspections', []) as InspectionSubmission[];
    let filtered = inspections;

    // Filter by inspector if not admin or devsecops
    if (user.role === 'inspector') {
      filtered = filtered.filter((i) => i.inspectorId === user.id);
    }

    // Filter by form type
    if (formType && typeof formType === 'string') {
      filtered = filtered.filter((i) => i.formType === formType);
    }

    // Filter by status
    if (status && typeof status === 'string') {
      filtered = filtered.filter((i) => i.status === status);
    }

    // Filter by date range
    if (startDate && typeof startDate === 'string') {
      filtered = filtered.filter((i) => new Date(i.createdAt) >= new Date(startDate));
    }
    if (endDate && typeof endDate === 'string') {
      filtered = filtered.filter((i) => new Date(i.createdAt) <= new Date(endDate));
    }

    // Sort by creation date (newest first)
    filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    // Pagination
    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);
    const startIndex = (pageNum - 1) * limitNum;
    const endIndex = startIndex + limitNum;
    const paginated = filtered.slice(startIndex, endIndex);

    return res.status(200).json({
      inspections: paginated,
      total: filtered.length,
      page: pageNum,
      totalPages: Math.ceil(filtered.length / limitNum),
    });
  } catch (error) {
    console.error('Get inspections error:', error);
    return res.status(500).json({ error: 'Failed to fetch inspections' });
  }
}

// POST /api/inspections
async function createInspection(req: NextApiRequest, res: NextApiResponse, user: User) {
  const { formType, formTemplateId, data, signature, status = 'draft' } = req.body;

  try {
    if (!formType || !formTemplateId || !data) {
      return res.status(400).json({
        error: 'Missing required fields',
        required: ['formType', 'formTemplateId', 'data'],
      });
    }

    const now = new Date().toISOString();
    const newInspection: InspectionSubmission = {
      id: Date.now().toString(),
      formType,
      formTemplateId,
      inspectorId: user.id,
      inspectorName: user.name,
      data,
      signature: signature
        ? {
            dataUrl: signature.dataUrl,
            timestamp: signature.timestamp || now,
            inspectorId: user.id,
            inspectorName: user.name,
          }
        : undefined,
      status: status === 'submitted' ? 'submitted' : 'draft',
      submittedAt: status === 'submitted' ? now : undefined,
      createdAt: now,
      updatedAt: now,
      googleDriveExport: status === 'submitted' ? { status: 'pending' } : undefined,
    };

    const inspections = storage.load('inspections', []) as InspectionSubmission[];
    inspections.push(newInspection);
    storage.save('inspections', inspections);

    // Log inspection creation
    logAuditEvent({
      action: 'INSPECTION_CREATED',
      performedBy: user.id,
      performedByName: user.name,
      details: { inspectionId: newInspection.id, formType, status: newInspection.status },
      timestamp: now,
    });

    // Trigger Google Drive export if submitted
    if (status === 'submitted') {
      // This would trigger background job in production
      // For now, just mark as pending
    }

    return res.status(201).json({
      inspection: newInspection,
      message: 'Inspection created successfully',
    });
  } catch (error) {
    console.error('Create inspection error:', error);
    return res.status(500).json({ error: 'Failed to create inspection' });
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
  requiredPermission: 'canViewInspections',
});
