// This service manages all data operations
// In production, this would connect to a database

interface Category {
  id: string;
  name: string;
  description: string;
  icon: string;
  active: boolean;
}

interface ChecklistItem {
  id: string;
  categoryId: string;
  item: string;
  description: string;
  priority: 'required' | 'recommended' | 'optional';
  active: boolean;
}

interface Template {
  id: string;
  name: string;
  description: string;
  items: string[]; // Array of item IDs
  active: boolean;
}

class DataService {
  private readonly STORAGE_KEYS = {
    CATEGORIES: 'inspection_categories',
    ITEMS: 'inspection_items',
    TEMPLATES: 'inspection_templates',
    INSPECTIONS: 'inspection_records',
  };

  // Categories
  getCategories(): Category[] {
    const data = localStorage.getItem(this.STORAGE_KEYS.CATEGORIES);
    return data ? JSON.parse(data) : this.getDefaultCategories();
  }

  saveCategories(categories: Category[]): void {
    localStorage.setItem(this.STORAGE_KEYS.CATEGORIES, JSON.stringify(categories));
  }

  // Items
  getItems(): ChecklistItem[] {
    const data = localStorage.getItem(this.STORAGE_KEYS.ITEMS);
    return data ? JSON.parse(data) : this.getDefaultItems();
  }

  saveItems(items: ChecklistItem[]): void {
    localStorage.setItem(this.STORAGE_KEYS.ITEMS, JSON.stringify(items));
  }

  // Templates
  getTemplates(): Template[] {
    const data = localStorage.getItem(this.STORAGE_KEYS.TEMPLATES);
    return data ? JSON.parse(data) : [];
  }

  saveTemplates(templates: Template[]): void {
    localStorage.setItem(this.STORAGE_KEYS.TEMPLATES, JSON.stringify(templates));
  }

  // Default data
  private getDefaultCategories(): Category[] {
    return [
      {
        id: '1',
        name: 'WORKING AREAS',
        description: 'General workplace safety',
        icon: '🏗️',
        active: true,
      },
      {
        id: '2',
        name: 'PPE',
        description: 'Personal Protective Equipment',
        icon: '🦺',
        active: true,
      },
      {
        id: '3',
        name: 'EQUIPMENT & TOOLS',
        description: 'Equipment safety',
        icon: '🔧',
        active: true,
      },
      { id: '4', name: 'WORK AT HEIGHT', description: 'Height safety', icon: '🪜', active: true },
      { id: '5', name: 'FIRE SAFETY', description: 'Fire prevention', icon: '🔥', active: true },
    ];
  }

  private getDefaultItems(): ChecklistItem[] {
    return [
      // Add default items here
    ];
  }
}

export default new DataService();
