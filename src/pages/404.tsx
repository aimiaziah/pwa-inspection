import React from 'react';
import Link from 'next/link';
import BaseLayout from '@/layouts/BaseLayout';

const Custom404: React.FC = () => {
  return (
    <BaseLayout title="404 - Page Not Found">
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-center">
        {/* Large 404 Text */}
        <h1 className="text-8xl font-bold text-gray-200 mb-4">404</h1>

        {/* Error Message */}
        <h2 className="text-2xl font-semibold text-gray-800 mb-2">Page Not Found</h2>

        <p className="text-gray-600 mb-8 max-w-md">
          The page you're looking for doesn't exist or has been moved.
        </p>

        {/* Navigation Options */}
        <div className="flex gap-4">
          <Link href="/">Go Home</Link>

          <Link href="/hse-inspection">View Checklist</Link>
        </div>
      </div>
    </BaseLayout>
  );
};

export default Custom404;
