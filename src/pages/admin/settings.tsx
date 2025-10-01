// src/pages/admin/settings.tsx - System Configuration and Settings
import React, { useState, useEffect } from 'react';
import AdminLayout from '@/layouts/AdminLayout';
import ProtectedRoute from '@/components/ProtectedRoute';
import { storage } from '@/utils/storage';
import { useAuth } from '@/hooks/useAuth';

interface SystemSettings {
  appName: string;
  companyName: string;
  logoUrl?: string;
  primaryColor: string;
  timezone: string;
  dateFormat: string;
  language: string;
  emailNotifications: boolean;
  autoBackup: boolean;
  backupFrequency: 'daily' | 'weekly' | 'monthly';
  retentionPeriod: number; // in days
  maxFileSize: number; // in MB
  allowedFileTypes: string[];
  sessionTimeout: number; // in minutes
  passwordPolicy: {
    minLength: number;
    requireUppercase: boolean;
    requireLowercase: boolean;
    requireNumbers: boolean;
    requireSpecialChars: boolean;
  };
  maintenanceMode: boolean;
  debugMode: boolean;
}

interface AuditLog {
  id: string;
  timestamp: string;
  user: string;
  action: string;
  details: string;
  category: 'system' | 'user' | 'form' | 'security';
}

const SystemSettings: React.FC = () => {
  const { user } = useAuth();
  const [settings, setSettings] = useState<SystemSettings>({
    appName: 'PWA Inspection Platform',
    companyName: 'Theta Edge Berhad',
    primaryColor: '#2563eb',
    timezone: 'Asia/Kuala_Lumpur',
    dateFormat: 'DD/MM/YYYY',
    language: 'en',
    emailNotifications: true,
    autoBackup: true,
    backupFrequency: 'weekly',
    retentionPeriod: 365,
    maxFileSize: 10,
    allowedFileTypes: ['jpg', 'jpeg', 'png', 'pdf', 'doc', 'docx'],
    sessionTimeout: 60,
    passwordPolicy: {
      minLength: 8,
      requireUppercase: true,
      requireLowercase: true,
      requireNumbers: true,
      requireSpecialChars: false,
    },
    maintenanceMode: false,
    debugMode: false,
  });

  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'general' | 'security' | 'files' | 'backup' | 'audit'>(
    'general',
  );

  // Backup state
  const [showBackupModal, setShowBackupModal] = useState(false);
  const [backupProgress, setBackupProgress] = useState(0);
  const [backupStatus, setBackupStatus] = useState<'idle' | 'running' | 'complete' | 'error'>(
    'idle',
  );

  useEffect(() => {
    loadSettings();
    loadAuditLogs();
  }, []);

  const loadSettings = () => {
    try {
      const storedSettings = storage.load('system_settings', null);
      if (storedSettings) {
        setSettings({ ...settings, ...storedSettings });
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadAuditLogs = () => {
    try {
      const logs = storage.load('audit_logs', []) as AuditLog[];
      setAuditLogs(logs.slice(0, 100)); // Show latest 100 logs
    } catch (error) {
      console.error('Error loading audit logs:', error);
    }
  };

  const saveSettings = async () => {
    setSaving(true);
    try {
      storage.save('system_settings', settings);

      // Add audit log
      const auditEntry: AuditLog = {
        id: Date.now().toString(),
        timestamp: new Date().toISOString(),
        user: user?.name || 'Admin',
        action: 'settings_updated',
        details: 'System settings were updated',
        category: 'system',
      };

      const updatedLogs = [auditEntry, ...auditLogs];
      storage.save('audit_logs', updatedLogs);
      setAuditLogs(updatedLogs);

      alert('Settings saved successfully!');
    } catch (error) {
      console.error('Error saving settings:', error);
      alert('Error saving settings. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const resetToDefaults = () => {
    if (
      !confirm(
        'Are you sure you want to reset all settings to default values? This action cannot be undone.',
      )
    ) {
      return;
    }

    const defaultSettings: SystemSettings = {
      appName: 'PWA Inspection Platform',
      companyName: 'Theta Edge Berhad',
      primaryColor: '#2563eb',
      timezone: 'Asia/Kuala_Lumpur',
      dateFormat: 'DD/MM/YYYY',
      language: 'en',
      emailNotifications: true,
      autoBackup: true,
      backupFrequency: 'weekly',
      retentionPeriod: 365,
      maxFileSize: 10,
      allowedFileTypes: ['jpg', 'jpeg', 'png', 'pdf', 'doc', 'docx'],
      sessionTimeout: 60,
      passwordPolicy: {
        minLength: 8,
        requireUppercase: true,
        requireLowercase: true,
        requireNumbers: true,
        requireSpecialChars: false,
      },
      maintenanceMode: false,
      debugMode: false,
    };

    setSettings(defaultSettings);
  };

  const performBackup = async () => {
    setBackupStatus('running');
    setBackupProgress(0);
    setShowBackupModal(true);

    try {
      // Simulate backup process
      const steps = [
        { name: 'Preparing backup...', duration: 1000 },
        { name: 'Backing up users...', duration: 1500 },
        { name: 'Backing up roles...', duration: 1000 },
        { name: 'Backing up forms...', duration: 2000 },
        { name: 'Backing up inspections...', duration: 2500 },
        { name: 'Backing up settings...', duration: 1000 },
        { name: 'Finalizing backup...', duration: 1000 },
      ];

      for (let i = 0; i < steps.length; i++) {
        await new Promise((resolve) => setTimeout(resolve, steps[i].duration));
        setBackupProgress(((i + 1) / steps.length) * 100);
      }

      // Create actual backup
      const backupData = {
        timestamp: new Date().toISOString(),
        version: '1.0',
        users: storage.load('users', []),
        roles: storage.load('roles', []),
        categories: storage.load('checklist_categories', []),
        items: storage.load('checklist_items', []),
        templates: storage.load('form_templates', []),
        inspections: storage.load('inspections', []),
        fireInspections: storage.load('fire_extinguisher_inspections', []),
        firstAidInspections: storage.load('first_aid_inspections', []),
        settings,
        auditLogs,
      };

      const dataStr = JSON.stringify(backupData, null, 2);
      const dataUri = `data:application/json;charset=utf-8,${encodeURIComponent(dataStr)}`;
      const backupFileName = `system-backup-${new Date().toISOString().split('T')[0]}.json`;

      const linkElement = document.createElement('a');
      linkElement.setAttribute('href', dataUri);
      linkElement.setAttribute('download', backupFileName);
      linkElement.click();

      setBackupStatus('complete');

      // Add audit log
      const auditEntry: AuditLog = {
        id: Date.now().toString(),
        timestamp: new Date().toISOString(),
        user: user?.name || 'Admin',
        action: 'backup_created',
        details: `System backup created: ${backupFileName}`,
        category: 'system',
      };

      const updatedLogs = [auditEntry, ...auditLogs];
      storage.save('audit_logs', updatedLogs);
      setAuditLogs(updatedLogs);
    } catch (error) {
      console.error('Backup error:', error);
      setBackupStatus('error');
    }
  };

  const clearAuditLogs = () => {
    if (!confirm('Are you sure you want to clear all audit logs? This action cannot be undone.')) {
      return;
    }

    storage.remove('audit_logs');
    setAuditLogs([]);
  };

  const exportAuditLogs = () => {
    const dataStr = JSON.stringify(auditLogs, null, 2);
    const dataUri = `data:application/json;charset=utf-8,${encodeURIComponent(dataStr)}`;
    const exportFileName = `audit-logs-${new Date().toISOString().split('T')[0]}.json`;

    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileName);
    linkElement.click();
  };

  const getAuditIcon = (category: string) => {
    switch (category) {
      case 'system':
        return '⚙️';
      case 'user':
        return '👤';
      case 'form':
        return '📋';
      case 'security':
        return '🔒';
      default:
        return '📝';
    }
  };

  const tabs = [
    { id: 'general', label: 'General', icon: '🏢' },
    { id: 'security', label: 'Security', icon: '🔒' },
    { id: 'files', label: 'Files', icon: '📁' },
    { id: 'backup', label: 'Backup', icon: '💾' },
    { id: 'audit', label: 'Audit', icon: '📊' },
  ];

  if (loading) {
    return (
      <ProtectedRoute requiredPermission="canManageSystem">
        <AdminLayout title="System Settings">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4" />
              <p className="text-gray-600">Loading settings...</p>
            </div>
          </div>
        </AdminLayout>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute requiredPermission="canManageSystem">
      <AdminLayout title="System Settings">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">System Settings</h1>
              <p className="text-gray-600">Configure system-wide settings and preferences</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={resetToDefaults}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
              >
                Reset to Defaults
              </button>
              <button
                onClick={saveSettings}
                disabled={saving}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Save Settings'}
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <span className="mr-2">{tab.icon}</span>
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>

          {/* Tab Content */}
          <div className="bg-white rounded-lg shadow p-6">
            {activeTab === 'general' && (
              <div className="space-y-6">
                <h3 className="text-lg font-medium text-gray-900">General Settings</h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Application Name
                    </label>
                    <input
                      type="text"
                      value={settings.appName}
                      onChange={(e) => setSettings({ ...settings, appName: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Company Name
                    </label>
                    <input
                      type="text"
                      value={settings.companyName}
                      onChange={(e) => setSettings({ ...settings, companyName: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Primary Color
                    </label>
                    <div className="flex items-center space-x-3">
                      <input
                        type="color"
                        value={settings.primaryColor}
                        onChange={(e) => setSettings({ ...settings, primaryColor: e.target.value })}
                        className="h-10 w-20 border border-gray-300 rounded cursor-pointer"
                      />
                      <input
                        type="text"
                        value={settings.primaryColor}
                        onChange={(e) => setSettings({ ...settings, primaryColor: e.target.value })}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Timezone</label>
                    <select
                      value={settings.timezone}
                      onChange={(e) => setSettings({ ...settings, timezone: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="Asia/Kuala_Lumpur">Asia/Kuala Lumpur</option>
                      <option value="Asia/Singapore">Asia/Singapore</option>
                      <option value="Asia/Jakarta">Asia/Jakarta</option>
                      <option value="UTC">UTC</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Date Format
                    </label>
                    <select
                      value={settings.dateFormat}
                      onChange={(e) => setSettings({ ...settings, dateFormat: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                      <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                      <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Language</label>
                    <select
                      value={settings.language}
                      onChange={(e) => setSettings({ ...settings, language: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="en">English</option>
                      <option value="ms">Bahasa Malaysia</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-4">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={settings.emailNotifications}
                      onChange={(e) =>
                        setSettings({ ...settings, emailNotifications: e.target.checked })
                      }
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">Enable email notifications</span>
                  </label>

                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={settings.maintenanceMode}
                      onChange={(e) =>
                        setSettings({ ...settings, maintenanceMode: e.target.checked })
                      }
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">
                      Maintenance mode (restrict access)
                    </span>
                  </label>

                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={settings.debugMode}
                      onChange={(e) => setSettings({ ...settings, debugMode: e.target.checked })}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">
                      Debug mode (show detailed error messages)
                    </span>
                  </label>
                </div>
              </div>
            )}

            {activeTab === 'security' && (
              <div className="space-y-6">
                <h3 className="text-lg font-medium text-gray-900">Security Settings</h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Session Timeout (minutes)
                    </label>
                    <input
                      type="number"
                      value={settings.sessionTimeout}
                      onChange={(e) =>
                        setSettings({ ...settings, sessionTimeout: parseInt(e.target.value) || 60 })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      min="5"
                      max="480"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Minimum Password Length
                    </label>
                    <input
                      type="number"
                      value={settings.passwordPolicy.minLength}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          passwordPolicy: {
                            ...settings.passwordPolicy,
                            minLength: parseInt(e.target.value) || 8,
                          },
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      min="4"
                      max="32"
                    />
                  </div>
                </div>

                <div>
                  <h4 className="text-md font-medium text-gray-900 mb-3">Password Requirements</h4>
                  <div className="space-y-3">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={settings.passwordPolicy.requireUppercase}
                        onChange={(e) =>
                          setSettings({
                            ...settings,
                            passwordPolicy: {
                              ...settings.passwordPolicy,
                              requireUppercase: e.target.checked,
                            },
                          })
                        }
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="ml-2 text-sm text-gray-700">Require uppercase letters</span>
                    </label>

                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={settings.passwordPolicy.requireLowercase}
                        onChange={(e) =>
                          setSettings({
                            ...settings,
                            passwordPolicy: {
                              ...settings.passwordPolicy,
                              requireLowercase: e.target.checked,
                            },
                          })
                        }
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="ml-2 text-sm text-gray-700">Require lowercase letters</span>
                    </label>

                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={settings.passwordPolicy.requireNumbers}
                        onChange={(e) =>
                          setSettings({
                            ...settings,
                            passwordPolicy: {
                              ...settings.passwordPolicy,
                              requireNumbers: e.target.checked,
                            },
                          })
                        }
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="ml-2 text-sm text-gray-700">Require numbers</span>
                    </label>

                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={settings.passwordPolicy.requireSpecialChars}
                        onChange={(e) =>
                          setSettings({
                            ...settings,
                            passwordPolicy: {
                              ...settings.passwordPolicy,
                              requireSpecialChars: e.target.checked,
                            },
                          })
                        }
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="ml-2 text-sm text-gray-700">Require special characters</span>
                    </label>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'files' && (
              <div className="space-y-6">
                <h3 className="text-lg font-medium text-gray-900">File Settings</h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Maximum File Size (MB)
                    </label>
                    <input
                      type="number"
                      value={settings.maxFileSize}
                      onChange={(e) =>
                        setSettings({ ...settings, maxFileSize: parseInt(e.target.value) || 10 })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      min="1"
                      max="100"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Data Retention Period (days)
                    </label>
                    <input
                      type="number"
                      value={settings.retentionPeriod}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          retentionPeriod: parseInt(e.target.value) || 365,
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      min="30"
                      max="3650"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Allowed File Types
                  </label>
                  <div className="flex flex-wrap gap-2 mb-3">
                    {settings.allowedFileTypes.map((type, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800"
                      >
                        .{type}
                        <button
                          onClick={() => {
                            const newTypes = settings.allowedFileTypes.filter(
                              (_, i) => i !== index,
                            );
                            setSettings({ ...settings, allowedFileTypes: newTypes });
                          }}
                          className="ml-2 text-blue-600 hover:text-blue-800"
                        >
                          ✕
                        </button>
                      </span>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Add file type (e.g., txt)"
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          const newType = (e.target as HTMLInputElement).value.trim().toLowerCase();
                          if (newType && !settings.allowedFileTypes.includes(newType)) {
                            setSettings({
                              ...settings,
                              allowedFileTypes: [...settings.allowedFileTypes, newType],
                            });
                            (e.target as HTMLInputElement).value = '';
                          }
                        }
                      }}
                    />
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'backup' && (
              <div className="space-y-6">
                <h3 className="text-lg font-medium text-gray-900">Backup & Recovery</h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="flex items-center mb-4">
                      <input
                        type="checkbox"
                        checked={settings.autoBackup}
                        onChange={(e) => setSettings({ ...settings, autoBackup: e.target.checked })}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="ml-2 text-sm text-gray-700">Enable automatic backups</span>
                    </label>

                    {settings.autoBackup && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Backup Frequency
                        </label>
                        <select
                          value={settings.backupFrequency}
                          onChange={(e) =>
                            setSettings({ ...settings, backupFrequency: e.target.value as any })
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="daily">Daily</option>
                          <option value="weekly">Weekly</option>
                          <option value="monthly">Monthly</option>
                        </select>
                      </div>
                    )}
                  </div>

                  <div className="space-y-4">
                    <button
                      onClick={performBackup}
                      className="w-full px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center justify-center"
                    >
                      <svg
                        className="w-5 h-5 mr-2"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10"
                        />
                      </svg>
                      Create Manual Backup
                    </button>

                    <div className="text-sm text-gray-600">
                      Manual backups are downloaded as JSON files that can be used to restore the
                      system.
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'audit' && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-medium text-gray-900">Audit Trail</h3>
                  <div className="flex gap-3">
                    <button
                      onClick={exportAuditLogs}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                      Export Logs
                    </button>
                    <button
                      onClick={clearAuditLogs}
                      className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                    >
                      Clear Logs
                    </button>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-gray-900">{auditLogs.length}</div>
                      <div className="text-sm text-gray-600">Total Events</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">
                        {auditLogs.filter((log) => log.category === 'system').length}
                      </div>
                      <div className="text-sm text-gray-600">System Events</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">
                        {auditLogs.filter((log) => log.category === 'user').length}
                      </div>
                      <div className="text-sm text-gray-600">User Events</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-purple-600">
                        {auditLogs.filter((log) => log.category === 'security').length}
                      </div>
                      <div className="text-sm text-gray-600">Security Events</div>
                    </div>
                  </div>
                </div>

                <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
                  <table className="min-w-full divide-y divide-gray-300">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Event
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          User
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Category
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Timestamp
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {auditLogs.slice(0, 20).map((log) => (
                        <tr key={log.id}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div>
                              <div className="text-sm font-medium text-gray-900">{log.action}</div>
                              <div className="text-sm text-gray-500">{log.details}</div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {log.user}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                              <span className="mr-1">{getAuditIcon(log.category)}</span>
                              {log.category}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {new Date(log.timestamp).toLocaleString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {auditLogs.length === 0 && (
                    <div className="text-center py-12">
                      <p className="text-gray-500">No audit logs found.</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Backup Progress Modal */}
          {showBackupModal && (
            <div className="fixed inset-0 z-50 overflow-y-auto">
              <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                <div className="fixed inset-0 transition-opacity" aria-hidden="true">
                  <div className="absolute inset-0 bg-gray-500 opacity-75" />
                </div>
                <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
                  <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                    <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                      System Backup
                    </h3>

                    <div className="space-y-4">
                      <div>
                        <div className="flex justify-between text-sm text-gray-600 mb-2">
                          <span>Progress</span>
                          <span>{Math.round(backupProgress)}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${backupProgress}%` }}
                          />
                        </div>
                      </div>

                      {backupStatus === 'running' && (
                        <div className="flex items-center text-sm text-gray-600">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2" />
                          Creating backup...
                        </div>
                      )}

                      {backupStatus === 'complete' && (
                        <div className="flex items-center text-sm text-green-600">
                          <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                            <path
                              fillRule="evenodd"
                              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                              clipRule="evenodd"
                            />
                          </svg>
                          Backup completed successfully!
                        </div>
                      )}

                      {backupStatus === 'error' && (
                        <div className="flex items-center text-sm text-red-600">
                          <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                            <path
                              fillRule="evenodd"
                              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                              clipRule="evenodd"
                            />
                          </svg>
                          Backup failed. Please try again.
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                    <button
                      onClick={() => setShowBackupModal(false)}
                      className="w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:w-auto sm:text-sm"
                    >
                      Close
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

export default SystemSettings;
