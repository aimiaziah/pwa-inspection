// src/pages/admin/users.tsx
import React, { useState, useEffect } from 'react';
import AdminLayout from '@/layouts/AdminLayout';
import ProtectedRoute from '@/components/ProtectedRoute';
import { storage } from '@/utils/storage';
import { useAuth, User, UserRole } from '@/hooks/useAuth';

type UserStatus = 'active' | 'inactive' | 'pending';

interface UserFormData {
  name: string;
  pin: string;
  role: UserRole;
  status: UserStatus;
  department: string;
  permissions: {
    // Admin permissions
    canManageUsers: boolean;
    canManageRoles: boolean;
    canManageForms: boolean;
    canSetNotifications: boolean;
    canManageSystem: boolean;
    canBackupRestore: boolean;

    // Inspector permissions
    canCreateInspections: boolean;
    canEditInspections: boolean;
    canViewInspections: boolean;
    canViewAnalytics: boolean;
    canViewGoogleDriveStatus: boolean;
    canAddDigitalSignature: boolean;
    canExportReports: boolean;

    // DevSecOps permissions
    canViewDevSecOpsDashboard: boolean;
    canViewSecurityLogs: boolean;
    canViewSystemErrors: boolean;
    canTrackDataBreaches: boolean;
    canMonitorUpdates: boolean;
    canViewAuditTrail: boolean;
  };
}

const UserManagement: React.FC = () => {
  const { user: currentUser } = useAuth();
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
  const [userFormData, setUserFormData] = useState<UserFormData>({
    name: '',
    pin: '',
    role: 'inspector',
    status: 'active',
    department: '',
    permissions: {
      // Admin permissions
      canManageUsers: false,
      canManageRoles: false,
      canManageForms: false,
      canSetNotifications: false,
      canManageSystem: false,
      canBackupRestore: false,

      // Inspector permissions
      canCreateInspections: true,
      canEditInspections: true,
      canViewInspections: true,
      canViewAnalytics: true,
      canViewGoogleDriveStatus: true,
      canAddDigitalSignature: true,
      canExportReports: true,

      // DevSecOps permissions
      canViewDevSecOpsDashboard: false,
      canViewSecurityLogs: false,
      canViewSystemErrors: false,
      canTrackDataBreaches: false,
      canMonitorUpdates: false,
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
      const storedUsers = storage.load('users', []) as User[];
      setUsers(storedUsers);
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
      filtered = filtered.filter((user) => user.isActive === (statusFilter === 'active'));
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
          user.department.toLowerCase().includes(query) ||
          user.pin.includes(query),
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

  const generateRandomPIN = () => {
    const pin = Math.floor(1000 + Math.random() * 9000).toString();
    // Check if PIN already exists
    const existingUser = users.find((u) => u.pin === pin);
    if (existingUser) {
      return generateRandomPIN(); // Recursive call if PIN exists
    }
    return pin;
  };

  const handleCreateUser = () => {
    setEditingUser(null);
    setUserFormData({
      name: '',
      pin: generateRandomPIN(),
      role: 'inspector',
      status: 'active',
      department: '',
      permissions: getDefaultPermissions('inspector'),
    });
    setShowUserModal(true);
  };

  const handleEditUser = (user: User) => {
    setEditingUser(user);
    setUserFormData({
      name: user.name,
      pin: user.pin,
      role: user.role,
      status: user.isActive ? 'active' : 'inactive',
      department: user.department,
      permissions: user.permissions,
    });
    setShowUserModal(true);
  };

  const handleSaveUser = () => {
    try {
      if (!userFormData.name || !userFormData.pin || !userFormData.department) {
        alert('Please fill in all required fields.');
        return;
      }

      // Check for duplicate PIN
      const existingPinUser = users.find(
        (u) => u.pin === userFormData.pin && u.id !== editingUser?.id,
      );
      if (existingPinUser) {
        alert('This PIN is already in use. Please choose a different PIN.');
        return;
      }

      const now = new Date().toISOString();
      let updatedUsers;

      if (editingUser) {
        // Update existing user
        updatedUsers = users.map((user) =>
          user.id === editingUser.id
            ? {
                ...user,
                name: userFormData.name,
                pin: userFormData.pin,
                role: userFormData.role,
                isActive: userFormData.status === 'active',
                department: userFormData.department,
                permissions: userFormData.permissions,
              }
            : user,
        );
      } else {
        // Create new user
        const newUser: User = {
          id: Date.now().toString(),
          name: userFormData.name,
          pin: userFormData.pin,
          role: userFormData.role,
          isActive: userFormData.status === 'active',
          department: userFormData.department,
          permissions: userFormData.permissions,
          createdAt: now,
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
    if (userId === currentUser?.id) {
      alert('You cannot delete your own account.');
      return;
    }

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
    if (userId === currentUser?.id) {
      alert('You cannot deactivate your own account.');
      return;
    }

    try {
      const updatedUsers = users.map((user) =>
        user.id === userId ? { ...user, isActive: !user.isActive } : user,
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
      case 'inspector':
        return 'bg-green-100 text-green-800';
      case 'devsecops':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (isActive: boolean) => {
    return isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800';
  };

  const getDefaultPermissions = (role: UserRole) => {
    switch (role) {
      case 'admin':
        return {
          // Admin permissions
          canManageUsers: true,
          canManageRoles: true,
          canManageForms: true,
          canSetNotifications: true,
          canManageSystem: true,
          canBackupRestore: true,

          // Inspector permissions (limited access)
          canCreateInspections: false,
          canEditInspections: false,
          canViewInspections: true,
          canViewAnalytics: true,
          canViewGoogleDriveStatus: true,
          canAddDigitalSignature: false,
          canExportReports: true,

          // DevSecOps permissions (limited access)
          canViewDevSecOpsDashboard: false,
          canViewSecurityLogs: true,
          canViewSystemErrors: true,
          canTrackDataBreaches: true,
          canMonitorUpdates: true,
          canViewAuditTrail: true,
        };
      case 'inspector':
        return {
          // Admin permissions
          canManageUsers: false,
          canManageRoles: false,
          canManageForms: false,
          canSetNotifications: false,
          canManageSystem: false,
          canBackupRestore: false,

          // Inspector permissions
          canCreateInspections: true,
          canEditInspections: true,
          canViewInspections: true,
          canViewAnalytics: true,
          canViewGoogleDriveStatus: true,
          canAddDigitalSignature: true,
          canExportReports: true,

          // DevSecOps permissions
          canViewDevSecOpsDashboard: false,
          canViewSecurityLogs: false,
          canViewSystemErrors: false,
          canTrackDataBreaches: false,
          canMonitorUpdates: false,
          canViewAuditTrail: false,
        };
      case 'devsecops':
        return {
          // Admin permissions
          canManageUsers: false,
          canManageRoles: false,
          canManageForms: false,
          canSetNotifications: false,
          canManageSystem: false,
          canBackupRestore: false,

          // Inspector permissions (limited access)
          canCreateInspections: false,
          canEditInspections: false,
          canViewInspections: true,
          canViewAnalytics: false,
          canViewGoogleDriveStatus: false,
          canAddDigitalSignature: false,
          canExportReports: false,

          // DevSecOps permissions
          canViewDevSecOpsDashboard: true,
          canViewSecurityLogs: true,
          canViewSystemErrors: true,
          canTrackDataBreaches: true,
          canMonitorUpdates: true,
          canViewAuditTrail: true,
        };
      default:
        return userFormData.permissions;
    }
  };

  const handleRoleChange = (role: UserRole) => {
    setUserFormData((prev) => ({
      ...prev,
      role,
      permissions: getDefaultPermissions(role),
    }));
  };

  if (loading) {
    return (
      <ProtectedRoute requiredPermission="canManageUsers">
        <AdminLayout title="User Management">
          <div className="flex items-center justify-center h-64">
            <div className="text-gray-600">Loading users...</div>
          </div>
        </AdminLayout>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute requiredPermission="canManageUsers">
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
              className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 flex items-center"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4v16m8-8H4"
                />
              </svg>
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
                    {users.filter((u) => u.isActive).length}
                  </p>
                </div>
                <span className="text-4xl">✅</span>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-600">Admins</p>
                  <p className="text-3xl font-bold text-purple-600">
                    {users.filter((u) => u.role === 'admin').length}
                  </p>
                </div>
                <span className="text-4xl">👑</span>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-600">Inspectors</p>
                  <p className="text-3xl font-bold text-blue-600">
                    {users.filter((u) => u.role === 'inspector').length}
                  </p>
                </div>
                <span className="text-4xl">🔍</span>
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search users..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Role</label>
                <select
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All Roles</option>
                  <option value="admin">Admin</option>
                  <option value="inspector">Inspector</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All Status</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Department</label>
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
            </div>

            {(roleFilter || statusFilter || departmentFilter || searchQuery) && (
              <button
                onClick={clearFilters}
                className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800 underline"
              >
                Clear Filters
              </button>
            )}
          </div>

          {/* Users Table */}
          <div className="bg-white shadow overflow-hidden sm:rounded-md">
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
                        PIN
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
                              <div className="text-sm text-gray-500">ID: {user.id}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="font-mono text-sm bg-gray-100 px-2 py-1 rounded">
                            {user.pin}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getRoleColor(
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
                            className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(
                              user.isActive,
                            )}`}
                          >
                            {user.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {user.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : 'Never'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex space-x-2">
                            <button
                              onClick={() => handleEditUser(user)}
                              className="text-indigo-600 hover:text-indigo-900"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => toggleUserStatus(user.id)}
                              className={
                                user.isActive
                                  ? 'text-red-600 hover:text-red-900'
                                  : 'text-green-600 hover:text-green-900'
                              }
                              disabled={user.id === currentUser?.id}
                            >
                              {user.isActive ? 'Deactivate' : 'Activate'}
                            </button>
                            <button
                              onClick={() => handleDeleteUser(user.id)}
                              className="text-red-600 hover:text-red-900"
                              disabled={user.id === currentUser?.id}
                            >
                              Delete
                            </button>
                          </div>
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
            <div className="fixed inset-0 z-50 overflow-y-auto">
              <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                <div className="fixed inset-0 transition-opacity" aria-hidden="true">
                  <div className="absolute inset-0 bg-gray-500 opacity-75" />
                </div>

                <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
                  <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                    <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                      {editingUser ? 'Edit User' : 'Create New User'}
                    </h3>

                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Name *
                        </label>
                        <input
                          type="text"
                          value={userFormData.name}
                          onChange={(e) =>
                            setUserFormData({ ...userFormData, name: e.target.value })
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Enter full name"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          PIN Code *
                        </label>
                        <div className="flex">
                          <input
                            type="text"
                            value={userFormData.pin}
                            onChange={(e) =>
                              setUserFormData({
                                ...userFormData,
                                pin: e.target.value.replace(/\D/g, '').slice(0, 4),
                              })
                            }
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-l-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="4-digit PIN"
                            maxLength={4}
                          />
                          <button
                            type="button"
                            onClick={() =>
                              setUserFormData({ ...userFormData, pin: generateRandomPIN() })
                            }
                            className="px-3 py-2 bg-gray-100 border border-l-0 border-gray-300 rounded-r-md hover:bg-gray-200 text-sm"
                          >
                            Generate
                          </button>
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Role *
                        </label>
                        <select
                          value={userFormData.role}
                          onChange={(e) => handleRoleChange(e.target.value as UserRole)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="inspector">Inspector</option>
                          <option value="supervisor">Supervisor</option>
                          <option value="admin">Admin</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Department *
                        </label>
                        <select
                          value={userFormData.department}
                          onChange={(e) =>
                            setUserFormData({ ...userFormData, department: e.target.value })
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

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Status
                        </label>
                        <select
                          value={userFormData.status}
                          onChange={(e) =>
                            setUserFormData({
                              ...userFormData,
                              status: e.target.value as UserStatus,
                            })
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="active">Active</option>
                          <option value="inactive">Inactive</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Permissions
                        </label>
                        <div className="space-y-2 max-h-32 overflow-y-auto border border-gray-200 rounded-md p-3">
                          {Object.entries(userFormData.permissions).map(([permission, granted]) => (
                            <label key={permission} className="flex items-center">
                              <input
                                type="checkbox"
                                checked={granted}
                                onChange={(e) =>
                                  setUserFormData((prev) => ({
                                    ...prev,
                                    permissions: {
                                      ...prev.permissions,
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
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                    <button
                      onClick={handleSaveUser}
                      className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm"
                    >
                      {editingUser ? 'Update User' : 'Create User'}
                    </button>
                    <button
                      onClick={() => setShowUserModal(false)}
                      className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </AdminLayout>
    </ProtectedRoute>
  );
};

export default UserManagement;
