export interface ChecklistItem {
  id: string;
  category: string;
  title: string;
  description: string;
  priority: 'required' | 'recommended' | 'optional';
  documentation?: string;
  testSteps?: string[];
}

export const checklistCategories = [
  {
    id: 'manifest',
    name: 'Web App Manifest',
    description: 'Configuration for installability',
    icon: '📱',
  },
  {
    id: 'service-worker',
    name: 'Service Worker',
    description: 'Offline functionality',
    icon: '⚡',
  },
  {
    id: 'performance',
    name: 'Performance',
    description: 'Speed optimizations',
    icon: '🚀',
  },
  {
    id: 'security',
    name: 'Security',
    description: 'HTTPS and CSP',
    icon: '🔒',
  },
  {
    id: 'ui-ux',
    name: 'UI/UX',
    description: 'User experience',
    icon: '🎨',
  },
];

export const checklistItems: ChecklistItem[] = [
  // Add your actual checklist items here
  {
    id: 'manifest-1',
    category: 'manifest',
    title: 'Manifest file exists',
    description: 'A valid manifest.json file is present and properly linked',
    priority: 'required',
    documentation: 'https://web.dev/add-manifest/',
    testSteps: [
      'Check for <link rel="manifest" href="/manifest.json"> in HTML head',
      'Verify manifest.json is accessible at the specified path',
      'Validate JSON syntax',
    ],
  },
  // Add more items...
];
