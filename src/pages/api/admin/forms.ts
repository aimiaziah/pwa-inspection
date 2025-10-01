// src/pages/api/admin/forms.ts
import formidable from 'formidable';
import * as XLSX from 'xlsx';

// POST /api/admin/forms/import
export async function importFormFromExcel(req: NextApiRequest, res: NextApiResponse) {
  const form = new formidable.IncomingForm();

  form.parse(req, async (err, fields, files) => {
    if (err) {
      return res.status(400).json({ error: 'Failed to parse file' });
    }

    const file = Array.isArray(files.file) ? files.file[0] : files.file;
    const workbook = XLSX.readFile(file.filepath);
    const worksheet = workbook.Sheets[workbook.SheetNames[0]];
    const data = XLSX.utils.sheet_to_json(worksheet);

    // Parse Excel data into form template
    const formTemplate: FormTemplate = {
      id: Date.now().toString(),
      name: fields.name || 'Imported Form',
      description: fields.description || '',
      version: 1,
      status: 'draft',
      createdBy: req.session.user.id,
      createdAt: new Date(),
      updatedAt: new Date(),
      fields: parseExcelToFields(data),
      categories: extractCategories(data),
      metadata: {
        inspectionType: 'custom',
        frequency: 'monthly',
      },
      changeHistory: [],
    };

    const forms = storage.load('form_templates', []);
    forms.push(formTemplate);
    storage.save('form_templates', forms);

    res.status(201).json({ form: formTemplate });
  });
}

// GET /api/admin/forms/:id/export
export async function exportFormAsTemplate(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;

  try {
    const forms = storage.load('form_templates', []);
    const form = forms.find((f) => f.id === id);

    if (!form) {
      return res.status(404).json({ error: 'Form not found' });
    }

    // Create Excel workbook
    const wb = XLSX.utils.book_new();

    // Create worksheet with form fields
    const wsData = form.fields.map((field) => ({
      Category: form.categories.find((c) => c.id === field.categoryId)?.name || '',
      'Field Label': field.label,
      'Field Type': field.type,
      Required: field.required ? 'Yes' : 'No',
      Description: field.description || '',
      Options: field.options?.join(', ') || '',
    }));

    const ws = XLSX.utils.json_to_sheet(wsData);
    XLSX.utils.book_append_sheet(wb, ws, 'Form Template');

    // Generate buffer
    const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
    res.setHeader('Content-Disposition', `attachment; filename="${form.name}-template.xlsx"`);
    res.send(buffer);
  } catch (error) {
    res.status(500).json({ error: 'Failed to export form' });
  }
}

// POST /api/admin/forms/:id/version
export async function createFormVersion(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;
  const { changeDescription, fields, categories } = req.body;

  try {
    const forms = storage.load('form_templates', []);
    const formIndex = forms.findIndex((f) => f.id === id);

    if (formIndex === -1) {
      return res.status(404).json({ error: 'Form not found' });
    }

    const currentForm = forms[formIndex];
    const newVersion = currentForm.version + 1;

    // Add to change history
    currentForm.changeHistory.push({
      version: currentForm.version,
      changedBy: req.session.user.name,
      changedAt: new Date(),
      changeDescription: 'Previous version',
      fields: currentForm.fields,
    });

    // Update form
    currentForm.version = newVersion;
    currentForm.fields = fields;
    currentForm.categories = categories;
    currentForm.updatedAt = new Date();

    forms[formIndex] = currentForm;
    storage.save('form_templates', forms);

    res.status(200).json({ form: currentForm });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create version' });
  }
}
