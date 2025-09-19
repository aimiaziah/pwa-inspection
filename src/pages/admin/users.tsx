import React, { useState, useEffect } from 'react';
import AdminLayout from '@/layouts/AdminLayout';
import { storage } from '@/utils/storage';

type UserRole = 'inspector' | 'supervisor' | 'admin';
type UserStatus = 'active' | 'inactive' | 'pending';

interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  department: string;
  lastLogin?: string;
  createdAt: string;
  createdBy: string;
  permissions: {
    canCreateInspections: boolean;
    canApproveInspections: boolean;
    canViewAnalytics: boolean;
    canManageUsers: boolean;
    canExportReports: boolean;
    canViewAuditTrail: boolean;
  };
}

const UserManagement: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [roleFilter, setRoleFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [departmentFilter, setDepartmentFilter] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Modal state
  const [showUserModal, setShowUserModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [userFormData, setUserFormData] = useState<Partial<User>>({
    name: '',
    email: '',
    role: 'inspector',
    status: 'active',
    department: '',
    permissions: {
      canCreateInspections: true,
      canApproveInspections: false,
      canViewAnalytics: false,
      canManageUsers: false,
      canExportReports: false,
      canViewAuditTrail: false,
    },
  });

  const departments = [
    'Safety & Compliance',
    'Operations',
    'Maintenance',
    'Security',
    'Administration',
    'Quality Assurance',
    'Environmental',
    'Other',
  ];

  useEffect(() => {
    loadUsers();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [users, roleFilter, statusFilter, departmentFilter, searchQuery]);

  const loadUsers = () => {
    setLoading(true);

    try {
      // Load users from storage or create default users if none exist
      let savedUsers = storage.load('users') || [];

      if (savedUsers.length === 0) {
        // Create default users for demo
        savedUsers = [
          {
            id: '1',
            name: 'John Inspector',
            email: 'john.inspector@company.com',
            role: 'inspector',
            status: 'active',
            department: 'Safety & Compliance',
            lastLogin: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
            createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days ago
            createdBy: 'System Admin',
            permissions: {
              canCreateInspections: true,
              canApproveInspections: false,
              canViewAnalytics: false,
              canManageUsers: false,
              canExportReports: true,
              canViewAuditTrail: false,
            },
          },
          {
            id: '2',
            name: 'Sarah Supervisor',
            email: 'sarah.supervisor@company.com',
            role: 'supervisor',
            status: 'active',
            department: 'Safety & Compliance',
            lastLogin: new Date(Date.now() - 30 * 60 * 1000).toISOString(), // 30 minutes ago
            createdAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(), // 60 days ago
            createdBy: 'System Admin',
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
            name: 'Mike Manager',
            email: 'mike.manager@company.com',
            role: 'admin',
            status: 'active',
            department: 'Operations',
            lastLogin: new Date(Date.now() - 5 * 60 * 1000).toISOString(), // 5 minutes ago
            createdAt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(), // 90 days ago
            createdBy: 'System Admin',
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
            id: '4',
            name: 'Lisa Trainee',
            email: 'lisa.trainee@company.com',
            role: 'inspector',
            status: 'pending',
            department: 'Safety & Compliance',
            createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days ago
            createdBy: 'Sarah Supervisor',
            permissions: {
              canCreateInspections: false,
              canApproveInspections: false,
              canViewAnalytics: false,
              canManageUsers: false,
              canExportReports: false,
              canViewAuditTrail: false,
            },
          },
        ];

        storage.save('users', savedUsers);
      }

      setUsers(savedUsers);
    } catch (error) {
      console.error('Error loading users:', error);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...users];

    // Role filter
    if (roleFilter) {
      filtered = filtered.filter((user) => user.role === roleFilter);
    }

    // Status filter
    if (statusFilter) {
      filtered = filtered.filter((user) => user.status === statusFilter);
    }

    // Department filter
    if (departmentFilter) {
      filtered = filtered.filter((user) => user.department === departmentFilter);
    }

    // Search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (user) =>
          user.name.toLowerCase().includes(query) ||
          user.email.toLowerCase().includes(query) ||
          user.department.toLowerCase().includes(query),
      );
    }

    setFilteredUsers(filtered);
  };

  const clearFilters = () => {
    setRoleFilter('');
    setStatusFilter('');
    setDepartmentFilter('');
    setSearchQuery('');
  };

  const handleCreateUser = () => {
    setEditingUser(null);
    setUserFormData({
      name: '',
      email: '',
      role: 'inspector',
      status: 'active',
      department: '',
      permissions: {
        canCreateInspections: true,
        canApproveInspections: false,
        canViewAnalytics: false,
        canManageUsers: false,
        canExportReports: false,
        canViewAuditTrail: false,
      },
    });
    setShowUserModal(true);
  };

  const handleEditUser = (user: User) => {
    setEditingUser(user);
    setUserFormData(user);
    setShowUserModal(true);
  };

  const handleSaveUser = () => {
    try {
      if (!userFormData.name || !userFormData.email || !userFormData.department) {
        alert('Please fill in all required fields.');
        return;
      }

      const now = new Date().toISOString();
      let updatedUsers;

      if (editingUser) {
        // Update existing user
        updatedUsers = users.map((user) =>
          user.id === editingUser.id ? { ...user, ...userFormData } : user,
        );
      } else {
        // Create new user
        const newUser: User = {
          id: Date.now().toString(),
          ...(userFormData as User),
          createdAt: now,
          createdBy: 'Current Admin', // In real app, get from auth context
        };
        updatedUsers = [...users, newUser];
      }

      storage.save('users', updatedUsers);
      setUsers(updatedUsers);
      setShowUserModal(false);
    } catch (error) {
      console.error('Error saving user:', error);
      alert('Error saving user. Please try again.');
    }
  };

  const handleDeleteUser = (userId: string) => {
    if (!confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      return;
    }

    try {
      const updatedUsers = users.filter((user) => user.id !== userId);
      storage.save('users', updatedUsers);
      setUsers(updatedUsers);
    } catch (error) {
      console.error('Error deleting user:', error);
      alert('Error deleting user. Please try again.');
    }
  };

  const toggleUserStatus = (userId: string) => {
    try {
      const updatedUsers = users.map((user) =>
        user.id === userId
          ? { ...user, status: user.status === 'active' ? 'inactive' : ('active' as UserStatus) }
          : user,
      );
      storage.save('users', updatedUsers);
      setUsers(updatedUsers);
    } catch (error) {
      console.error('Error updating user status:', error);
      alert('Error updating user status. Please try again.');
    }
  };

  const getRoleColor = (role: UserRole) => {
    switch (role) {
      case 'admin':
        return 'bg-purple-100 text-purple-800';
      case 'supervisor':
        return 'bg-blue-100 text-blue-800';
      case 'inspector':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: UserStatus) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'inactive':
        return 'bg-gray-100 text-gray-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getRelativeTime = (timestamp: string) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffInMinutes = Math.floor((now.getTime() - time.getTime()) / (1000 * 60));

    if (diffInMinutes < 60) return `${diffInMinutes} min ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)} hr ago`;
    return `${Math.floor(diffInMinutes / 1440)} days ago`;
  };

  // Get default permissions based on role
  const getDefaultPermissions = (role: UserRole) => {
    switch (role) {
      case 'admin':
        return {
          canCreateInspections: true,
          canApproveInspections: true,
          canViewAnalytics: true,
          canManageUsers: true,
          canExportReports: true,
          canViewAuditTrail: true,
        };
      case 'supervisor':
        return {
          canCreateInspections: true,
          canApproveInspections: true,
          canViewAnalytics: true,
          canManageUsers: false,
          canExportReports: true,
          canViewAuditTrail: true,
        };
      case 'inspector':
        return {
          canCreateInspections: true,
          canApproveInspections: false,
          canViewAnalytics: false,
          canManageUsers: false,
          canExportReports: true,
          canViewAuditTrail: false,
        };
      default:
        return userFormData.permissions || {};
    }
  };

  // Update permissions when role changes
  const handleRoleChange = (role: UserRole) => {
    setUserFormData((prev) => ({
      ...prev,
      role,
      permissions: getDefaultPermissions(role),
    }));
  };

  if (loading) {
    return (
      <AdminLayout title="User Management">
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-600">Loading users...</div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="User Management">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">User Management</h1>
            <p className="text-gray-600">Manage user accounts and permissions</p>
          </div>
          <button
            onClick={handleCreateUser}
            className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
          >
            Add New User
          </button>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-600">Total Users</p>
                <p className="text-3xl font-bold text-gray-900">{users.length}</p>
              </div>
              <span className="text-4xl">👥</span>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-600">Active Users</p>
                <p className="text-3xl font-bold text-green-600">
                  {users.filter((u) => u.status === 'active').length}
                </p>
              </div>
              <span className="text-4xl">✅</span>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-600">Pending Approval</p>
                <p className="text-3xl font-bold text-yellow-600">
                  {users.filter((u) => u.status === 'pending').length}
                </p>
              </div>
              <span className="text-4xl">⏳</span>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-600">Administrators</p>
                <p className="text-3xl font-bold text-purple-600">
                  {users.filter((u) => u.role === 'admin').length}
                </p>
              </div>
              <span className="text-4xl">🔐</span>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Filters</h3>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
              <input
                type="text"
                placeholder="Search users..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Roles</option>
                <option value="admin">Administrator</option>
                <option value="supervisor">Supervisor</option>
                <option value="inspector">Inspector</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Statuses</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="pending">Pending</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
              <select
                value={departmentFilter}
                onChange={(e) => setDepartmentFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Departments</option>
                {departments.map((dept) => (
                  <option key={dept} value={dept}>
                    {dept}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-end">
              <button
                onClick={clearFilters}
                className="w-full px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600"
              >
                Clear Filters
              </button>
            </div>
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Users ({filteredUsers.length})</h3>
          </div>

          {filteredUsers.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-600">No users found matching your criteria.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      User
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Role
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Department
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Last Login
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredUsers.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                              <span className="text-sm font-medium text-gray-700">
                                {user.name
                                  .split(' ')
                                  .map((n) => n[0])
                                  .join('')}
                              </span>
                            </div>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">{user.name}</div>
                            <div className="text-sm text-gray-500">{user.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full capitalize ${getRoleColor(
                            user.role,
                          )}`}
                        >
                          {user.role}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {user.department}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full capitalize ${getStatusColor(
                            user.status,
                          )}`}
                        >
                          {user.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {user.lastLogin ? getRelativeTime(user.lastLogin) : 'Never'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                        <button
                          onClick={() => handleEditUser(user)}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => toggleUserStatus(user.id)}
                          className={`${
                            user.status === 'active'
                              ? 'text-red-600 hover:text-red-900'
                              : 'text-green-600 hover:text-green-900'
                          }`}
                        >
                          {user.status === 'active' ? 'Deactivate' : 'Activate'}
                        </button>
                        <button
                          onClick={() => handleDeleteUser(user.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* User Modal */}
        {showUserModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex justify-between items-start mb-6">
                  <h3 className="text-lg font-semibold text-gray-900">
                    {editingUser ? 'Edit User' : 'Create New User'}
                  </h3>
                  <button
                    onClick={() => setShowUserModal(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    ✕
                  </button>
                </div>

                <div className="space-y-4">
                  {/* Basic Information */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={userFormData.name}
                        onChange={(e) =>
                          setUserFormData((prev) => ({ ...prev, name: e.target.value }))
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Full name"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Email <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="email"
                        value={userFormData.email}
                        onChange={(e) =>
                          setUserFormData((prev) => ({ ...prev, email: e.target.value }))
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="email@company.com"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                      <select
                        value={userFormData.role}
                        onChange={(e) => handleRoleChange(e.target.value as UserRole)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="inspector">Inspector</option>
                        <option value="supervisor">Supervisor</option>
                        <option value="admin">Administrator</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                      <select
                        value={userFormData.status}
                        onChange={(e) =>
                          setUserFormData((prev) => ({
                            ...prev,
                            status: e.target.value as UserStatus,
                          }))
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                        <option value="pending">Pending</option>
                      </select>
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Department <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={userFormData.department}
                        onChange={(e) =>
                          setUserFormData((prev) => ({ ...prev, department: e.target.value }))
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">Select Department</option>
                        {departments.map((dept) => (
                          <option key={dept} value={dept}>
                            {dept}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Permissions */}
                  <div>
                    <h4 className="text-md font-medium text-gray-900 mb-3">Permissions</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {Object.entries(userFormData.permissions || {}).map(
                        ([permission, granted]) => (
                          <label key={permission} className="flex items-center">
                            <input
                              type="checkbox"
                              checked={granted}
                              onChange={(e) =>
                                setUserFormData((prev) => ({
                                  ...prev,
                                  permissions: {
                                    ...prev.permissions!,
                                    [permission]: e.target.checked,
                                  },
                                }))
                              }
                              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                            <span className="ml-2 text-sm text-gray-700">
                              {permission
                                .replace(/([A-Z])/g, ' $1')
                                .replace(/^./, (str) => str.toUpperCase())}
                            </span>
                          </label>
                        ),
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-3 mt-6">
                  <button
                    onClick={() => setShowUserModal(false)}
                    className="px-4 py-2 text-gray-600 hover:text-gray-800"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveUser}
                    className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-md"
                  >
                    {editingUser ? 'Update User' : 'Create User'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default UserManagement;
