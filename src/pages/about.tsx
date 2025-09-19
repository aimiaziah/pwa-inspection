import React from 'react';
import BaseLayout from '@/layouts/BaseLayout';

const AboutPage: React.FC = () => {
  return (
    <BaseLayout title="About">
      <div className="prose max-w-none">
        <h2 className="text-2xl font-bold text-bits-dark mb-4">About PWA Inspection Checklist</h2>

        <div className="bg-bits-white border border-gray-200 rounded-lg p-6">
          <p className="text-bits-gray mb-4">
            This Progressive Web App provides a comprehensive checklist for inspecting and
            validating PWA implementations.
          </p>

          <h3 className="text-lg font-semibold text-bits-dark mb-2">Features</h3>
          <ul className="list-disc list-inside text-bits-gray mb-4">
            <li>Comprehensive PWA checklist</li>
            <li>Offline functionality</li>
            <li>Progress tracking</li>
            <li>Export results</li>
          </ul>

          <h3 className="text-lg font-semibold text-bits-dark mb-2">Version</h3>
          <p className="text-bits-gray">v1.0.0</p>
        </div>
      </div>
    </BaseLayout>
  );
};

export default AboutPage;
