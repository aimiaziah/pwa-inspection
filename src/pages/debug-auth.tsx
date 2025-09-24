// src/pages/debug-auth.tsx - Create this file temporarily for debugging
import React, { useState, useEffect } from 'react';
import { storage } from '@/utils/storage';

const DebugAuth: React.FC = () => {
  const [users, setUsers] = useState([]);
  const [storageData, setStorageData] = useState({});

  useEffect(() => {
    // Load all auth-related data
    const usersData = storage.load('users', []);
    const currentUser = storage.load('currentUser', null);

    setUsers(usersData);
    setStorageData({
      users: usersData,
      currentUser,
      localStorage: typeof window !== 'undefined' ? { ...localStorage } : {},
    });
  }, []);

  const clearStorage = () => {
    storage.clear();
    setUsers([]);
    setStorageData({});
    alert('Storage cleared! Refresh the page.');
  };

  const createDefaultUsers = () => {
    const defaultUsers = [
      {
        id: '1',
        name: 'Admin User',
        pin: '1234',
        role: 'admin',
        department: 'Administration',
        isActive: true,
        createdAt: new Date().toISOString(),
        permissions: {
          canCreateInspections: true,
          canApproveInspections: true,
          canViewAnalytics: true,
          canManageUsers: true,
          canExportReports: true,
          canViewAuditTrail: true,
        },
      },
      {
        id: '2',
        name: 'Supervisor Demo',
        pin: '5678',
        role: 'supervisor',
        department: 'Safety & Compliance',
        isActive: true,
        createdAt: new Date().toISOString(),
        permissions: {
          canCreateInspections: true,
          canApproveInspections: true,
          canViewAnalytics: true,
          canManageUsers: false,
          canExportReports: true,
          canViewAuditTrail: true,
        },
      },
      {
        id: '3',
        name: 'Inspector Demo',
        pin: '9999',
        role: 'inspector',
        department: 'Operations',
        isActive: true,
        createdAt: new Date().toISOString(),
        permissions: {
          canCreateInspections: true,
          canApproveInspections: false,
          canViewAnalytics: false,
          canManageUsers: false,
          canExportReports: true,
          canViewAuditTrail: false,
        },
      },
    ];

    storage.save('users', defaultUsers);
    setUsers(defaultUsers);
    alert('Default users created!');
  };

  const testPinLogin = (pin: string) => {
    const foundUser = users.find((u: any) => u.pin === pin && u.isActive);
    alert(`PIN ${pin}: ${foundUser ? `Found user: ${foundUser.name}` : 'No matching user found'}`);
  };

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Authentication Debug Page</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Actions */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-4">Actions</h2>
          <div className="space-y-3">
            <button
              onClick={clearStorage}
              className="w-full px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
            >
              Clear All Storage
            </button>
            <button
              onClick={createDefaultUsers}
              className="w-full px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Create Default Users
            </button>
            <div className="pt-2">
              <h3 className="font-medium mb-2">Test PIN Logins:</h3>
              <div className="flex gap-2">
                <button
                  onClick={() => testPinLogin('1234')}
                  className="px-3 py-1 bg-green-500 text-white rounded text-sm"
                >
                  Test 1234
                </button>
                <button
                  onClick={() => testPinLogin('5678')}
                  className="px-3 py-1 bg-green-500 text-white rounded text-sm"
                >
                  Test 5678
                </button>
                <button
                  onClick={() => testPinLogin('9999')}
                  className="px-3 py-1 bg-green-500 text-white rounded text-sm"
                >
                  Test 9999
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Current Users */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-4">Current Users ({users.length})</h2>
          {users.length > 0 ? (
            <div className="space-y-2">
              {users.map((user: any) => (
                <div key={user.id} className="p-3 bg-gray-50 rounded">
                  <div className="font-medium">{user.name}</div>
                  <div className="text-sm text-gray-600">
                    PIN: {user.pin} | Role: {user.role} | Active: {user.isActive ? 'Yes' : 'No'}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500">No users found in storage</p>
          )}
        </div>
      </div>

      {/* Raw Storage Data */}
      <div className="mt-6 bg-white p-6 rounded-lg shadow">
        <h2 className="text-lg font-semibold mb-4">Raw Storage Data</h2>
        <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto">
          {JSON.stringify(storageData, null, 2)}
        </pre>
      </div>

      <div className="mt-6 p-4 bg-yellow-50 rounded-lg">
        <h3 className="font-medium text-yellow-800 mb-2">Debug Steps:</h3>
        <ol className="text-sm text-yellow-700 list-decimal list-inside space-y-1">
          <li>Check if users exist in storage above</li>
          <li>If no users, click "Create Default Users"</li>
          <li>Test PIN buttons to verify user lookup works</li>
          <li>Check browser console for debug logs when trying to login</li>
          <li>Try the login page again with PINs: 1234, 5678, or 9999</li>
        </ol>
      </div>
    </div>
  );
};

export default DebugAuth;
