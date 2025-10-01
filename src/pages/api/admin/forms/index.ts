// src/pages/api/admin/forms/index.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { withRBAC } from '@/lib/rbac';
import { User } from '@/hooks/useAuth';
import { storage } from '@/utils/storage';

export interface FormTemplate {
  id: string;
  name: string;
  type: 'fire-extinguisher' | 'first-aid' | 'hse-inspection' | 'monthly-statistic' | 'custom';
  description: string;
  categories: FormCategory[];
  isActive: boolean;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  version: number;
}

export interface FormCategory {
  id: string;
  name: string;
  order: number;
  items: FormItem[];
}

export interface FormItem {
  id: string;
  label: string;
  type: 'text' | 'number' | 'checkbox' | 'radio' | 'select' | 'date' | 'textarea' | 'signature';
  required: boolean;
  options?: string[]; // For select/radio types
  placeholder?: string;
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
  };
  order: number;
}

async function handler(req: NextApiRequest, res: NextApiResponse, user: User) {
  if (req.method === 'GET') {
    return getForms(req, res);
  }
  if (req.method === 'POST') {
    return createForm(req, res, user);
  }
  return res.status(405).json({ error: 'Method not allowed' });
}

// GET /api/admin/forms - List all form templates
async function getForms(req: NextApiRequest, res: NextApiResponse) {
  const { type, isActive } = req.query;

  try {
    const forms = storage.load('formTemplates', []) as FormTemplate[];
    let filtered = forms;

    if (type && typeof type === 'string') {
      filtered = filtered.filter((f) => f.type === type);
    }

    if (isActive !== undefined) {
      const activeStatus = isActive === 'true';
      filtered = filtered.filter((f) => f.isActive === activeStatus);
    }

    return res.status(200).json({
      forms: filtered,
      total: filtered.length,
    });
  } catch (error) {
    console.error('Get forms error:', error);
    return res.status(500).json({ error: 'Failed to fetch forms' });
  }
}

// POST /api/admin/forms - Create new form template
async function createForm(req: NextApiRequest, res: NextApiResponse, user: User) {
  const { name, type, description, categories } = req.body;

  try {
    if (!name || !type || !categories) {
      return res.status(400).json({
        error: 'Missing required fields',
        required: ['name', 'type', 'categories'],
      });
    }

    const validTypes = [
      'fire-extinguisher',
      'first-aid',
      'hse-inspection',
      'monthly-statistic',
      'custom',
    ];
    if (!validTypes.includes(type)) {
      return res.status(400).json({
        error: 'Invalid form type',
        validTypes,
      });
    }

    const newForm: FormTemplate = {
      id: Date.now().toString(),
      name,
      type,
      description: description || '',
      categories: categories.map((cat: any, index: number) => ({
        id: `cat-${Date.now()}-${index}`,
        name: cat.name,
        order: cat.order || index,
        items: cat.items.map((item: any, itemIndex: number) => ({
          id: `item-${Date.now()}-${index}-${itemIndex}`,
          label: item.label,
          type: item.type || 'text',
          required: item.required || false,
          options: item.options,
          placeholder: item.placeholder,
          validation: item.validation,
          order: item.order || itemIndex,
        })),
      })),
      isActive: true,
      createdBy: user.id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      version: 1,
    };

    const forms = storage.load('formTemplates', []) as FormTemplate[];
    forms.push(newForm);
    storage.save('formTemplates', forms);

    // Log form creation
    logAuditEvent({
      action: 'FORM_CREATED',
      performedBy: user.id,
      performedByName: user.name,
      details: { formId: newForm.id, formName: newForm.name, formType: newForm.type },
      timestamp: new Date().toISOString(),
    });

    return res.status(201).json({
      form: newForm,
      message: 'Form template created successfully',
    });
  } catch (error) {
    console.error('Create form error:', error);
    return res.status(500).json({ error: 'Failed to create form' });
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
