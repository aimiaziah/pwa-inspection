// src/pages/api/admin/analytics.ts
export async function getAnalytics(req: NextApiRequest, res: NextApiResponse) {
  const { startDate, endDate, groupBy = 'day' } = req.query;

  try {
    const inspections = storage.load('inspections', []);
    const users = storage.load('users', []);
    const googleSync = storage.load('google_drive_sync', []);

    // Filter by date range
    const filtered = inspections.filter((i) => {
      const date = new Date(i.createdAt);
      return date >= new Date(startDate) && date <= new Date(endDate);
    });

    // Calculate analytics
    const analytics = {
      overview: {
        totalInspections: filtered.length,
        completedInspections: filtered.filter((i) => i.status === 'completed').length,
        draftInspections: filtered.filter((i) => i.status === 'draft').length,
        overdueInspections: calculateOverdue(filtered),
        averageCompletionTime: calculateAverageCompletionTime(filtered),
        complianceRate: calculateComplianceRate(filtered),
      },

      trends: generateTrendData(filtered, groupBy),

      inspectorPerformance: users
        .filter((u) => u.role === 'inspector')
        .map((inspector) => ({
          id: inspector.id,
          name: inspector.name,
          totalInspections: filtered.filter((i) => i.inspectedBy === inspector.name).length,
          completedInspections: filtered.filter(
            (i) => i.inspectedBy === inspector.name && i.status === 'completed',
          ).length,
          averageComplianceRate: calculateInspectorCompliance(inspector.id, filtered),
          lastActive: inspector.lastLogin,
        }))
        .sort((a, b) => b.totalInspections - a.totalInspections),

      categoryAnalysis: analyzeCategoryPerformance(filtered),

      googleDriveSync: {
        totalSynced: googleSync.filter((s) => s.syncStatus === 'synced').length,
        pendingSync: googleSync.filter((s) => s.syncStatus === 'pending').length,
        failedSync: googleSync.filter((s) => s.syncStatus === 'failed').length,
        lastSyncTime: googleSync
          .filter((s) => s.lastSyncAt)
          .sort((a, b) => new Date(b.lastSyncAt).getTime() - new Date(a.lastSyncAt).getTime())[0]
          ?.lastSyncAt,
        uploadHistory: googleSync
          .sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime())
          .slice(0, 10),
      },
    };

    res.status(200).json(analytics);
  } catch (error) {
    res.status(500).json({ error: 'Failed to generate analytics' });
  }
}

// Helper functions
function generateTrendData(inspections: any[], groupBy: string) {
  const grouped = {};

  inspections.forEach((inspection) => {
    const date = new Date(inspection.createdAt);
    let key;

    switch (groupBy) {
      case 'day':
        key = date.toISOString().split('T')[0];
        break;
      case 'week':
        key = getWeekNumber(date);
        break;
      case 'month':
        key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        break;
    }

    if (!grouped[key]) {
      grouped[key] = {
        date: key,
        total: 0,
        completed: 0,
        compliance: [],
      };
    }

    grouped[key].total++;
    if (inspection.status === 'completed') grouped[key].completed++;
    grouped[key].compliance.push(calculateComplianceForInspection(inspection));
  });

  return Object.values(grouped).map((group: any) => ({
    ...group,
    compliance:
      group.compliance.length > 0
        ? Math.round(group.compliance.reduce((a, b) => a + b, 0) / group.compliance.length)
        : 0,
  }));
}
