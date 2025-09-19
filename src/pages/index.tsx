import React from 'react';
import BaseLayout from '@/layouts/BaseLayout';
import Card from '@/components/Card';
import Link from 'next/link';

const HomePage: React.FC = () => {
  const inspectionTypes = [
    {
      title: 'Fire Extinguisher Checklist',
      description: 'Fire extinguisher inspection and maintenance',
      tags: ['Fire Extinguisher', 'Performance'],
      link: '/fire-extinguisher',
    },
    {
      title: 'First Aid Items Checklist',
      description: 'First aid kit inspection and restocking',
      tags: ['Equipment', 'Maintenance'],
      link: '/first-aid',
    },
    {
      title: 'HSE Inspection',
      description: 'Health, Safety & Environment comprehensive checklist',
      tags: ['Safety', 'Compliance'],
      link: '/hse-inspection',
    },
  ];

  return (
    <BaseLayout>
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-4">Inspection Management System</h2>
        <p className="text-gray-600 text-lg">
          Comprehensive digital inspection checklists for safety and compliance
        </p>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <Link href="/hse-inspection">
          <div className="text-3xl mb-2">📋</div>
          <div className="font-semibold">New Inspection</div>
          <div className="text-sm opacity-90">Start a new HSE inspection</div>
        </Link>

        <Link href="/saved">
          <div className="text-3xl mb-2">📁</div>
          <div className="font-semibold">View Reports</div>
          <div className="text-sm opacity-90">Access saved inspections</div>
        </Link>

        <Link href="/about">
          <div className="text-3xl mb-2">📊</div>
          <div className="font-semibold">Analytics</div>
          <div className="text-sm opacity-90">View inspection trends</div>
        </Link>
      </div>

      {/* Inspection Types */}
      <h3 className="text-xl font-bold text-gray-900 mb-4">Available Inspection Types</h3>
      <div className="grid gap-4">
        {inspectionTypes.map((type, index) => (
          <Link key={index} href={type.link}>
            <Card title={type.title} description={type.description} tags={type.tags} />
          </Link>
        ))}
      </div>

      {/* Recent Activity */}
      <div className="mt-12 p-6 bg-gray-50 rounded-lg">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Recent Activity</h3>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between items-center py-2 border-b border-gray-200">
            <span className="text-gray-600">No recent inspections</span>
            <span className="text-gray-400">-</span>
          </div>
        </div>
      </div>
    </BaseLayout>
  );
};

export default HomePage;
