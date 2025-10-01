// src/pages/api/inspections/[id].ts
import { NextApiRequest, NextApiResponse } from 'next';
import { withRBAC } from '@/lib/rbac';
import { User } from '@/hooks/useAuth';
import { storage } from '@/utils/storage';
import { InspectionSubmission } from './index';

async function handler(req: NextApiRequest, res: NextApiResponse, user: User) {
  const { id } = req.query;

  if (!id || typeof id !== 'string') {
    return res.status(400).json({ error: 'Invalid inspection ID' });
  }

  if (req.method === 'GET') {
    return getInspection(req, res, id, user);
  }
  if (req.method === 'PUT') {
    return updateInspection(req, res, id, user);
  }
  if (req.method === 'DELETE') {
    return deleteInspection(req, res, id, user);
  }
  return res.status(405).json({ error: 'Method not allowed' });
}

// GET /api/inspections/[id]
async function getInspection(
  req: NextApiRequest,
  res: NextApiResponse,
  inspectionId: string,
  user: User,
) {
  try {
    const inspections = storage.load('inspections', []) as InspectionSubmission[];
    const inspection = inspections.find((i) => i.id === inspectionId);

    if (!inspection) {
      return res.status(404).json({ error: 'Inspection not found' });
    }

    // Check permission: inspectors can only view their own
    if (user.role === 'inspector' && inspection.inspectorId !== user.id) {
      return res.status(403).json({ error: 'Forbidden - You can only view your own inspections' });
    }

    return res.status(200).json({ inspection });
  } catch (error) {
    console.error('Get inspection error:', error);
    return res.status(500).json({ error: 'Failed to fetch inspection' });
  }
}

// PUT /api/inspections/[id]
async function updateInspection(
  req: NextApiRequest,
  res: NextApiResponse,
  inspectionId: string,
  user: User,
) {
  const { data, signature, status } = req.body;

  try {
    const inspections = storage.load('inspections', []) as InspectionSubmission[];
    const inspectionIndex = inspections.findIndex((i) => i.id === inspectionId);

    if (inspectionIndex === -1) {
      return res.status(404).json({ error: 'Inspection not found' });
    }

    const existingInspection = inspections[inspectionIndex];

    // Check permission: inspectors can only edit their own
    if (user.role === 'inspector' && existingInspection.inspectorId !== user.id) {
      return res.status(403).json({ error: 'Forbidden - You can only edit your own inspections' });
    }

    // Cannot edit submitted inspections
    if (existingInspection.status === 'submitted' && user.role === 'inspector') {
      return res.status(400).json({ error: 'Cannot edit submitted inspections' });
    }

    // Update fields
    if (data) {
      existingInspection.data = data;
    }

    if (signature) {
      existingInspection.signature = {
        dataUrl: signature.dataUrl,
        timestamp: signature.timestamp || new Date().toISOString(),
        inspectorId: user.id,
        inspectorName: user.name,
      };
    }

    if (status) {
      existingInspection.status = status;
      if (status === 'submitted' && !existingInspection.submittedAt) {
        existingInspection.submittedAt = new Date().toISOString();
        existingInspection.googleDriveExport = { status: 'pending' };
      }
    }

    existingInspection.updatedAt = new Date().toISOString();

    inspections[inspectionIndex] = existingInspection;
    storage.save('inspections', inspections);

    // Log update
    logAuditEvent({
      action: 'INSPECTION_UPDATED',
      performedBy: user.id,
      performedByName: user.name,
      details: { inspectionId, status: existingInspection.status },
      timestamp: new Date().toISOString(),
    });

    return res.status(200).json({
      inspection: existingInspection,
      message: 'Inspection updated successfully',
    });
  } catch (error) {
    console.error('Update inspection error:', error);
    return res.status(500).json({ error: 'Failed to update inspection' });
  }
}

// DELETE /api/inspections/[id]
async function deleteInspection(
  req: NextApiRequest,
  res: NextApiResponse,
  inspectionId: string,
  user: User,
) {
  try {
    const inspections = storage.load('inspections', []) as InspectionSubmission[];
    const inspectionIndex = inspections.findIndex((i) => i.id === inspectionId);

    if (inspectionIndex === -1) {
      return res.status(404).json({ error: 'Inspection not found' });
    }

    const existingInspection = inspections[inspectionIndex];

    // Check permission: inspectors can only delete their own drafts
    if (user.role === 'inspector' && existingInspection.inspectorId !== user.id) {
      return res
        .status(403)
        .json({ error: 'Forbidden - You can only delete your own inspections' });
    }

    // Can only delete drafts
    if (existingInspection.status !== 'draft') {
      return res.status(400).json({ error: 'Can only delete draft inspections' });
    }

    inspections.splice(inspectionIndex, 1);
    storage.save('inspections', inspections);

    // Log deletion
    logAuditEvent({
      action: 'INSPECTION_DELETED',
      performedBy: user.id,
      performedByName: user.name,
      details: { inspectionId },
      timestamp: new Date().toISOString(),
    });

    return res.status(200).json({ message: 'Inspection deleted successfully' });
  } catch (error) {
    console.error('Delete inspection error:', error);
    return res.status(500).json({ error: 'Failed to delete inspection' });
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
