import React from 'react';
import BaseLayout from '@/layouts/BaseLayout';

const SavedPage: React.FC = () => {
  return (
    <BaseLayout title="Saved Items">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-bits-dark mb-4">Saved Checklist Items</h2>
        <p className="text-bits-gray">Your bookmarked items will appear here</p>
      </div>

      <div className="bg-bits-light-gray rounded-lg p-8 text-center">
        <p className="text-bits-gray">No saved items yet</p>
      </div>
    </BaseLayout>
  );
};

export default SavedPage;
