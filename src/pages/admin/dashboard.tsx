// src/pages/admin/dashboard.tsx
import React, { useState, useEffect } from 'react';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { Calendar, Users, FileText, Bell, TrendingUp, Upload } from 'lucide-react';

const AdminDashboard: React.FC = () => {
  const [analytics, setAnalytics] = useState(null);
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, [dateRange]);

  const fetchAnalytics = async () => {
    const response = await fetch(
      `/api/admin/analytics?startDate=${dateRange.start}&endDate=${dateRange.end}`,
    );
    const data = await response.json();
    setAnalytics(data);
    setLoading(false);
  };

  if (loading) return <LoadingSpinner />;

  return (
    <AdminLayout title="Admin Dashboard">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="Total Inspections"
          value={analytics.overview.totalInspections}
          icon={<FileText />}
          trend={analytics.overview.trend}
        />
        <StatCard
          title="Draft Inspections"
          value={analytics.overview.draftInspections}
          icon={<Calendar />}
          alert={analytics.overview.draftInspections > 5}
        />
        <StatCard
          title="Compliance Rate"
          value={`${analytics.overview.complianceRate}%`}
          icon={<TrendingUp />}
          color={analytics.overview.complianceRate > 90 ? 'green' : 'yellow'}
        />
        <StatCard
          title="Active Inspectors"
          value={analytics.inspectorPerformance.length}
          icon={<Users />}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Inspection Trends Chart */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Inspection Trends</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={analytics.trends}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="total" stroke="#8884d8" name="Total" />
              <Line type="monotone" dataKey="completed" stroke="#82ca9d" name="Completed" />
              <Line type="monotone" dataKey="compliance" stroke="#ffc658" name="Compliance %" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Inspector Performance */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Top Inspectors</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={analytics.inspectorPerformance.slice(0, 5)}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="totalInspections" fill="#8884d8" name="Total" />
              <Bar dataKey="completedInspections" fill="#82ca9d" name="Completed" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Google Drive Sync Status */}
      <div className="bg-white rounded-lg shadow p-6 mb-8">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Google Drive Sync Status</h3>
          <button className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            <Upload className="w-4 h-4 mr-2" />
            Sync Now
          </button>
        </div>

        <div className="grid grid-cols-3 gap-4 mb-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              {analytics.googleDriveSync.totalSynced}
            </div>
            <div className="text-sm text-gray-600">Synced</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-yellow-600">
              {analytics.googleDriveSync.pendingSync}
            </div>
            <div className="text-sm text-gray-600">Pending</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-red-600">
              {analytics.googleDriveSync.failedSync}
            </div>
            <div className="text-sm text-gray-600">Failed</div>
          </div>
        </div>

        <div className="border-t pt-4">
          <h4 className="font-medium mb-2">Recent Uploads</h4>
          <div className="space-y-2">
            {analytics.googleDriveSync.uploadHistory.map((upload) => (
              <div key={upload.id} className="flex justify-between items-center text-sm">
                <span>{upload.fileName}</span>
                <span className="text-gray-500">
                  {new Date(upload.uploadedAt).toLocaleDateString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};
