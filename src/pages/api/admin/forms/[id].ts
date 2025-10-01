// src/pages/api/admin/forms/[id].ts
import { NextApiRequest, NextApiResponse } from 'next';
import { withRBAC } from '@/lib/rbac';
import { User } from '@/hooks/useAuth';
import { storage } from '@/utils/storage';
import { FormTemplate } from './index';

async function handler(req: NextApiRequest, res: NextApiResponse, user: User) {
  const { id } = req.query;

  if (!id || typeof id !== 'string') {
    return res.status(400).json({ error: 'Invalid form ID' });
  }

  if (req.method === 'GET') {
    return getForm(req, res, id);
  }
  if (req.method === 'PUT') {
    return updateForm(req, res, id, user);
  }
  if (req.method === 'DELETE') {
    return deleteForm(req, res, id, user);
  }
  return res.status(405).json({ error: 'Method not allowed' });
}

// GET /api/admin/forms/[id]
async function getForm(req: NextApiRequest, res: NextApiResponse, formId: string) {
  try {
    const forms = storage.load('formTemplates', []) as FormTemplate[];
    const form = forms.find((f) => f.id === formId);

    if (!form) {
      return res.status(404).json({ error: 'Form not found' });
    }

    return res.status(200).json({ form });
  } catch (error) {
    console.error('Get form error:', error);
    return res.status(500).json({ error: 'Failed to fetch form' });
  }
}

// PUT /api/admin/forms/[id]
async function updateForm(req: NextApiRequest, res: NextApiResponse, formId: string, user: User) {
  const { name, description, categories, isActive } = req.body;

  try {
    const forms = storage.load('formTemplates', []) as FormTemplate[];
    const formIndex = forms.findIndex((f) => f.id === formId);

    if (formIndex === -1) {
      return res.status(404).json({ error: 'Form not found' });
    }

    const existingForm = forms[formIndex];

    // Update fields
    if (name) existingForm.name = name;
    if (description !== undefined) existingForm.description = description;
    if (typeof isActive === 'boolean') existingForm.isActive = isActive;

    if (categories) {
      existingForm.categories = categories.map((cat: any, index: number) => ({
        id: cat.id || `cat-${Date.now()}-${index}`,
        name: cat.name,
        order: cat.order || index,
        items: cat.items.map((item: any, itemIndex: number) => ({
          id: item.id || `item-${Date.now()}-${index}-${itemIndex}`,
          label: item.label,
          type: item.type || 'text',
          required: item.required || false,
          options: item.options,
          placeholder: item.placeholder,
          validation: item.validation,
          order: item.order || itemIndex,
        })),
      }));
      existingForm.version += 1;
    }

    existingForm.updatedAt = new Date().toISOString();

    forms[formIndex] = existingForm;
    storage.save('formTemplates', forms);

    // Log update
    logAuditEvent({
      action: 'FORM_UPDATED',
      performedBy: user.id,
      performedByName: user.name,
      details: { formId, formName: existingForm.name, version: existingForm.version },
      timestamp: new Date().toISOString(),
    });

    return res.status(200).json({
      form: existingForm,
      message: 'Form template updated successfully',
    });
  } catch (error) {
    console.error('Update form error:', error);
    return res.status(500).json({ error: 'Failed to update form' });
  }
}

// DELETE /api/admin/forms/[id]
async function deleteForm(req: NextApiRequest, res: NextApiResponse, formId: string, user: User) {
  try {
    const forms = storage.load('formTemplates', []) as FormTemplate[];
    const formIndex = forms.findIndex((f) => f.id === formId);

    if (formIndex === -1) {
      return res.status(404).json({ error: 'Form not found' });
    }

    const deletedForm = forms[formIndex];

    // Soft delete by deactivating
    forms[formIndex].isActive = false;
    storage.save('formTemplates', forms);

    // Log deletion
    logAuditEvent({
      action: 'FORM_DELETED',
      performedBy: user.id,
      performedByName: user.name,
      details: { formId, formName: deletedForm.name },
      timestamp: new Date().toISOString(),
    });

    return res.status(200).json({
      message: 'Form template deactivated successfully',
      form: deletedForm,
    });
  } catch (error) {
    console.error('Delete form error:', error);
    return res.status(500).json({ error: 'Failed to delete form' });
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
  requiredPermission: 'canManageForms',
});
