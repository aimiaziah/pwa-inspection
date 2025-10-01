// src/pages/admin/roles.tsx - Advanced Role Management System
import React, { useState, useEffect } from 'react';
import AdminLayout from '@/layouts/AdminLayout';
import ProtectedRoute from '@/components/ProtectedRoute';
import { storage } from '@/utils/storage';
import { useAuth, User, UserRole } from '@/hooks/useAuth';

interface Permission {
  key: string;
  label: string;
  description: string;
  category: 'basic' | 'inspection' | 'management' | 'system';
}

interface Role {
  id: string;
  name: string;
  displayName: string;
  description: string;
  permissions: Record<string, boolean>;
  isSystem: boolean;
  isActive: boolean;
  createdAt: string;
  createdBy: string;
  userCount: number;
}

const RoleManagement: React.FC = () => {
  const { user } = useAuth();
  const [roles, setRoles] = useState<Role[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal states
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [roleFormData, setRoleFormData] = useState({
    name: '',
    displayName: '',
    description: '',
    permissions: {} as Record<string, boolean>,
    isActive: true,
  });

  // Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');

  // Define available permissions
  const availablePermissions: Permission[] = [
    // Basic Permissions
    {
      key: 'canCreateInspections',
      label: 'Create Inspections',
      description: 'Can create new inspection records',
      category: 'basic',
    },
    {
      key: 'canEditInspections',
      label: 'Edit Inspections',
      description: 'Can edit draft inspection records',
      category: 'basic',
    },
    {
      key: 'canViewInspections',
      label: 'View Inspections',
      description: 'Can view inspection records',
      category: 'basic',
    },

    // Management Permissions
    {
      key: 'canManageUsers',
      label: 'Manage Users',
      description: 'Can create, edit, and delete user accounts',
      category: 'management',
    },
    {
      key: 'canManageRoles',
      label: 'Manage Roles',
      description: 'Can create and modify user roles',
      category: 'management',
    },
    {
      key: 'canManageForms',
      label: 'Manage Forms',
      description: 'Can modify inspection forms and categories',
      category: 'management',
    },
    {
      key: 'canViewAnalytics',
      label: 'View Analytics',
      description: 'Can access system analytics and reports',
      category: 'management',
    },

    // System Permissions
    {
      key: 'canExportReports',
      label: 'Export Reports',
      description: 'Can export inspection data and reports',
      category: 'system',
    },
    {
      key: 'canViewAuditTrail',
      label: 'View Audit Trail',
      description: 'Can view system audit logs',
      category: 'system',
    },
    {
      key: 'canManageSystem',
      label: 'System Administration',
      description: 'Full system administration access',
      category: 'system',
    },
    {
      key: 'canBackupRestore',
      label: 'Backup & Restore',
      description: 'Can backup and restore system data',
      category: 'system',
    },
  ];

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    setLoading(true);
    try {
      const rolesData = storage.load('roles', []) as Role[];
      const usersData = storage.load('users', []) as User[];

      // If no roles exist, create default roles
      if (rolesData.length === 0) {
        const defaultRoles = createDefaultRoles();
        storage.save('roles', defaultRoles);
        setRoles(defaultRoles);
      } else {
        // Update user counts for existing roles
        const updatedRoles = rolesData.map((role) => ({
          ...role,
          userCount: usersData.filter((u) => u.role === role.name).length,
        }));
        setRoles(updatedRoles);
      }

      setUsers(usersData);
    } catch (error) {
      console.error('Error loading roles data:', error);
    } finally {
      setLoading(false);
    }
  };

  const createDefaultRoles = (): Role[] => {
    const now = new Date().toISOString();

    return [
      {
        id: '1',
        name: 'inspector',
        displayName: 'Inspector',
        description: 'Field inspector with basic inspection permissions',
        permissions: {
          canCreateInspections: true,
          canEditInspections: true,
          canViewInspections: true,
          canExportReports: true,
        },
        isSystem: true,
        isActive: true,
        createdAt: now,
        createdBy: 'System',
        userCount: 0,
      },
      {
        id: '3',
        name: 'admin',
        displayName: 'Administrator',
        description: 'Full system administrator with all permissions',
        permissions: Object.fromEntries(availablePermissions.map((p) => [p.key, true])),
        isSystem: true,
        isActive: true,
        createdAt: now,
        createdBy: 'System',
        userCount: 0,
      },
    ];
  };

  // Filter roles based on search and status
  const filteredRoles = roles.filter((role) => {
    if (
      searchQuery &&
      !role.displayName.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !role.description.toLowerCase().includes(searchQuery.toLowerCase())
    ) {
      return false;
    }
    if (statusFilter && statusFilter !== 'all') {
      if (statusFilter === 'active' && !role.isActive) return false;
      if (statusFilter === 'inactive' && role.isActive) return false;
      if (statusFilter === 'system' && !role.isSystem) return false;
      if (statusFilter === 'custom' && role.isSystem) return false;
    }
    return true;
  });

  const handleCreateRole = () => {
    setEditingRole(null);
    setRoleFormData({
      name: '',
      displayName: '',
      description: '',
      permissions: {},
      isActive: true,
    });
    setShowRoleModal(true);
  };

  const handleEditRole = (role: Role) => {
    if (role.isSystem) {
      alert('System roles cannot be edited. You can create a copy instead.');
      return;
    }
    setEditingRole(role);
    setRoleFormData({
      name: role.name,
      displayName: role.displayName,
      description: role.description,
      permissions: { ...role.permissions },
      isActive: role.isActive,
    });
    setShowRoleModal(true);
  };

  const handleSaveRole = () => {
    try {
      if (!roleFormData.displayName.trim() || !roleFormData.name.trim()) {
        alert('Please fill in all required fields.');
        return;
      }

      // Check for duplicate names
      const existingRole = roles.find(
        (r) => r.name === roleFormData.name && r.id !== editingRole?.id,
      );
      if (existingRole) {
        alert('A role with this name already exists. Please choose a different name.');
        return;
      }

      const now = new Date().toISOString();
      let updatedRoles;

      if (editingRole) {
        // Update existing role
        updatedRoles = roles.map((role) =>
          role.id === editingRole.id
            ? {
                ...role,
                displayName: roleFormData.displayName,
                description: roleFormData.description,
                permissions: roleFormData.permissions,
                isActive: roleFormData.isActive,
              }
            : role,
        );
      } else {
        // Create new role
        const newRole: Role = {
          id: Date.now().toString(),
          name: roleFormData.name.toLowerCase().replace(/\s+/g, '_'),
          displayName: roleFormData.displayName,
          description: roleFormData.description,
          permissions: roleFormData.permissions,
          isSystem: false,
          isActive: roleFormData.isActive,
          createdAt: now,
          createdBy: user?.name || 'Admin',
          userCount: 0,
        };
        updatedRoles = [...roles, newRole];
      }

      storage.save('roles', updatedRoles);
      setRoles(updatedRoles);
      setShowRoleModal(false);
    } catch (error) {
      console.error('Error saving role:', error);
      alert('Error saving role. Please try again.');
    }
  };

  const handleDeleteRole = (roleId: string) => {
    const role = roles.find((r) => r.id === roleId);
    if (!role) return;

    if (role.isSystem) {
      alert('System roles cannot be deleted.');
      return;
    }

    if (role.userCount > 0) {
      alert(
        `Cannot delete role "${role.displayName}" because it is assigned to ${role.userCount} user(s).`,
      );
      return;
    }

    if (
      !confirm(
        `Are you sure you want to delete the role "${role.displayName}"? This action cannot be undone.`,
      )
    ) {
      return;
    }

    try {
      const updatedRoles = roles.filter((r) => r.id !== roleId);
      storage.save('roles', updatedRoles);
      setRoles(updatedRoles);
    } catch (error) {
      console.error('Error deleting role:', error);
      alert('Error deleting role. Please try again.');
    }
  };

  const toggleRoleStatus = (roleId: string) => {
    const role = roles.find((r) => r.id === roleId);
    if (!role) return;

    if (role.isSystem && !role.isActive) {
      alert('System roles cannot be deactivated.');
      return;
    }

    try {
      const updatedRoles = roles.map((r) =>
        r.id === roleId ? { ...r, isActive: !r.isActive } : r,
      );
      storage.save('roles', updatedRoles);
      setRoles(updatedRoles);
    } catch (error) {
      console.error('Error updating role status:', error);
      alert('Error updating role status. Please try again.');
    }
  };

  const handlePermissionChange = (permissionKey: string, granted: boolean) => {
    setRoleFormData((prev) => ({
      ...prev,
      permissions: {
        ...prev.permissions,
        [permissionKey]: granted,
      },
    }));
  };

  const getPermissionsByCategory = (category: string) => {
    return availablePermissions.filter((p) => p.category === category);
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'basic':
        return '📝';
      case 'inspection':
        return '✅';
      case 'management':
        return '👥';
      case 'system':
        return '⚙️';
      default:
        return '📋';
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'basic':
        return 'bg-blue-50 border-blue-200';
      case 'inspection':
        return 'bg-green-50 border-green-200';
      case 'management':
        return 'bg-purple-50 border-purple-200';
      case 'system':
        return 'bg-red-50 border-red-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  if (loading) {
    return (
      <ProtectedRoute requiredPermission="canManageRoles">
        <AdminLayout title="Role Management">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4" />
              <p className="text-gray-600">Loading roles...</p>
            </div>
          </div>
        </AdminLayout>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute requiredPermission="canManageRoles">
      <AdminLayout title="Role Management">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Role Management</h1>
              <p className="text-gray-600">Create and manage user roles with custom permissions</p>
            </div>
            <button
              onClick={handleCreateRole}
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
              Create Custom Role
            </button>
          </div>

          {/* Summary Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-600">Total Roles</p>
                  <p className="text-3xl font-bold text-gray-900">{roles.length}</p>
                </div>
                <span className="text-4xl">🔑</span>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-600">Active Roles</p>
                  <p className="text-3xl font-bold text-green-600">
                    {roles.filter((r) => r.isActive).length}
                  </p>
                </div>
                <span className="text-4xl">✅</span>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-600">System Roles</p>
                  <p className="text-3xl font-bold text-blue-600">
                    {roles.filter((r) => r.isSystem).length}
                  </p>
                </div>
                <span className="text-4xl">🛡️</span>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-600">Custom Roles</p>
                  <p className="text-3xl font-bold text-purple-600">
                    {roles.filter((r) => !r.isSystem).length}
                  </p>
                </div>
                <span className="text-4xl">⚡</span>
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search roles..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
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
                  <option value="system">System Roles</option>
                  <option value="custom">Custom Roles</option>
                </select>
              </div>

              <div className="flex items-end">
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setStatusFilter('');
                  }}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 underline"
                >
                  Clear Filters
                </button>
              </div>
            </div>
          </div>

          {/* Roles Table */}
          <div className="bg-white shadow overflow-hidden sm:rounded-md">
            {filteredRoles.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-600">No roles found matching your criteria.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Role
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Users
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Permissions
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Type
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredRoles.map((role) => (
                      <tr key={role.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <div>
                            <div className="text-sm font-medium text-gray-900 flex items-center">
                              {role.isSystem && <span className="mr-2">🛡️</span>}
                              {role.displayName}
                            </div>
                            <div className="text-sm text-gray-500">{role.description}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                            {role.userCount} users
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {Object.values(role.permissions).filter(Boolean).length} permissions
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              role.isSystem
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-purple-100 text-purple-800'
                            }`}
                          >
                            {role.isSystem ? 'System' : 'Custom'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              role.isActive
                                ? 'bg-green-100 text-green-800'
                                : 'bg-red-100 text-red-800'
                            }`}
                          >
                            {role.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex space-x-2">
                            <button
                              onClick={() => handleEditRole(role)}
                              className="text-blue-600 hover:text-blue-900"
                            >
                              {role.isSystem ? 'View' : 'Edit'}
                            </button>
                            <button
                              onClick={() => toggleRoleStatus(role.id)}
                              className={
                                role.isActive
                                  ? 'text-red-600 hover:text-red-900'
                                  : 'text-green-600 hover:text-green-900'
                              }
                            >
                              {role.isActive ? 'Deactivate' : 'Activate'}
                            </button>
                            {!role.isSystem && (
                              <button
                                onClick={() => handleDeleteRole(role.id)}
                                className="text-red-600 hover:text-red-900"
                                disabled={role.userCount > 0}
                              >
                                Delete
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Role Modal */}
          {showRoleModal && (
            <div className="fixed inset-0 z-50 overflow-y-auto">
              <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                <div className="fixed inset-0 transition-opacity" aria-hidden="true">
                  <div className="absolute inset-0 bg-gray-500 opacity-75" />
                </div>

                <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full">
                  <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                    <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                      {editingRole
                        ? editingRole.isSystem
                          ? 'View Role'
                          : 'Edit Role'
                        : 'Create New Role'}
                    </h3>

                    <div className="space-y-6">
                      {/* Basic Information */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Role Name *
                          </label>
                          <input
                            type="text"
                            value={roleFormData.name}
                            onChange={(e) =>
                              setRoleFormData({ ...roleFormData, name: e.target.value })
                            }
                            disabled={editingRole?.isSystem}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                            placeholder="e.g., senior_inspector"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Display Name *
                          </label>
                          <input
                            type="text"
                            value={roleFormData.displayName}
                            onChange={(e) =>
                              setRoleFormData({ ...roleFormData, displayName: e.target.value })
                            }
                            disabled={editingRole?.isSystem}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                            placeholder="e.g., Senior Inspector"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Description
                        </label>
                        <textarea
                          value={roleFormData.description}
                          onChange={(e) =>
                            setRoleFormData({ ...roleFormData, description: e.target.value })
                          }
                          disabled={editingRole?.isSystem}
                          rows={3}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                          placeholder="Describe the role and its responsibilities"
                        />
                      </div>

                      {/* Permissions */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-3">
                          Permissions
                        </label>
                        <div className="space-y-4">
                          {['basic', 'inspection', 'management', 'system'].map((category) => (
                            <div
                              key={category}
                              className={`border rounded-lg p-4 ${getCategoryColor(category)}`}
                            >
                              <h4 className="font-medium text-gray-900 mb-3 flex items-center">
                                <span className="mr-2">{getCategoryIcon(category)}</span>
                                {category.charAt(0).toUpperCase() + category.slice(1)} Permissions
                              </h4>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {getPermissionsByCategory(category).map((permission) => (
                                  <label key={permission.key} className="flex items-start">
                                    <input
                                      type="checkbox"
                                      checked={roleFormData.permissions[permission.key] || false}
                                      onChange={(e) =>
                                        handlePermissionChange(permission.key, e.target.checked)
                                      }
                                      disabled={editingRole?.isSystem}
                                      className="mt-1 rounded border-gray-300 text-blue-600 focus:ring-blue-500 disabled:opacity-50"
                                    />
                                    <div className="ml-2">
                                      <span className="text-sm font-medium text-gray-900">
                                        {permission.label}
                                      </span>
                                      <p className="text-xs text-gray-500">
                                        {permission.description}
                                      </p>
                                    </div>
                                  </label>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {!editingRole?.isSystem && (
                        <div>
                          <label className="flex items-center">
                            <input
                              type="checkbox"
                              checked={roleFormData.isActive}
                              onChange={(e) =>
                                setRoleFormData({ ...roleFormData, isActive: e.target.checked })
                              }
                              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                            <span className="ml-2 text-sm text-gray-700">Active</span>
                          </label>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                    {!editingRole?.isSystem && (
                      <button
                        onClick={handleSaveRole}
                        className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm"
                      >
                        {editingRole ? 'Update Role' : 'Create Role'}
                      </button>
                    )}
                    <button
                      onClick={() => setShowRoleModal(false)}
                      className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                    >
                      {editingRole?.isSystem ? 'Close' : 'Cancel'}
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

export default RoleManagement;
