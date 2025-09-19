import React, { useState } from 'react';
import { useRouter } from 'next/router';
import BaseLayout from '@/layouts/BaseLayout';

const AdminLogin: React.FC = () => {
  const router = useRouter();
  const [password, setPassword] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();

    // Simple password check (replace with proper auth)
    if (password === 'admin123') {
      localStorage.setItem('isAdmin', 'true');
      router.push('/admin');
    } else {
      alert('Invalid password');
    }
  };

  return (
    <BaseLayout title="Admin Access">
      <div className="max-w-md mx-auto">
        <div className="bg-white rounded-lg shadow-md p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Admin Access</h2>

          <form onSubmit={handleLogin}>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter admin password"
                required
              />
            </div>

            <button
              type="submit"
              className="w-full bg-blue-500 text-white py-2 rounded-md hover:bg-blue-600 transition-colors"
            >
              Access Admin Panel
            </button>
          </form>

          <p className="text-sm text-gray-500 mt-4 text-center">For demo: password is "admin123"</p>
        </div>
      </div>
    </BaseLayout>
  );
};

export default AdminLogin;
