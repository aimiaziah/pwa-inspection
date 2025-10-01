// src/pages/api/admin/forms/upload-excel.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { withRBAC } from '@/lib/rbac';
import { User } from '@/hooks/useAuth';
import { storage } from '@/utils/storage';
import { FormTemplate } from './index';

/**
 * POST /api/admin/forms/upload-excel
 * Upload Excel template to create new form
 *
 * Expected Excel structure:
 * - Sheet 1: Form metadata (name, type, description)
 * - Sheet 2+: Categories and items
 */
async function handler(req: NextApiRequest, res: NextApiResponse, user: User) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { formData, name, type, description } = req.body;

    if (!formData || !name || !type) {
      return res.status(400).json({
        error: 'Missing required fields',
        required: ['formData', 'name', 'type'],
        note: 'formData should be parsed Excel data with categories and items',
      });
    }

    // Validate form type
    const validTypes = [
      'fire-extinguisher',
      'first-aid',
      'hse-inspection',
      'monthly-statistic',
      'custom',
    ];
    if (!validTypes.includes(type)) {
      return res.status(400).json({ error: 'Invalid form type', validTypes });
    }

    // Parse Excel data into form structure
    const categories = parseExcelData(formData);

    if (!categories || categories.length === 0) {
      return res.status(400).json({
        error: 'Invalid Excel data structure',
        note: 'Excel should contain at least one category with items',
      });
    }

    // Create new form template
    const newForm: FormTemplate = {
      id: Date.now().toString(),
      name,
      type,
      description: description || '',
      categories,
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
      action: 'FORM_CREATED_FROM_EXCEL',
      performedBy: user.id,
      performedByName: user.name,
      details: { formId: newForm.id, formName: newForm.name, categoriesCount: categories.length },
      timestamp: new Date().toISOString(),
    });

    return res.status(201).json({
      form: newForm,
      message: 'Form template created successfully from Excel',
    });
  } catch (error) {
    console.error('Upload Excel error:', error);
    return res.status(500).json({
      error: 'Failed to process Excel file',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

/**
 * Parse Excel data into form categories and items
 * Expected format: Array of sheets, each sheet represents a category
 */
function parseExcelData(formData: any): any[] {
  try {
    if (!Array.isArray(formData)) {
      throw new Error('formData must be an array of categories');
    }

    return formData.map((category: any, catIndex: number) => {
      if (!category.name || !Array.isArray(category.items)) {
        throw new Error(`Invalid category structure at index ${catIndex}`);
      }

      return {
        id: `cat-${Date.now()}-${catIndex}`,
        name: category.name,
        order: category.order || catIndex,
        items: category.items.map((item: any, itemIndex: number) => {
          if (!item.label) {
            throw new Error(`Item at category ${catIndex}, index ${itemIndex} missing label`);
          }

          return {
            id: `item-${Date.now()}-${catIndex}-${itemIndex}`,
            label: item.label,
            type: item.type || 'text',
            required: item.required || false,
            options: item.options || [],
            placeholder: item.placeholder || '',
            validation: item.validation || {},
            order: item.order || itemIndex,
          };
        }),
      };
    });
  } catch (error) {
    console.error('Parse Excel data error:', error);
    throw error;
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

// Configure to handle larger payloads for file uploads
export const config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb',
    },
  },
};
