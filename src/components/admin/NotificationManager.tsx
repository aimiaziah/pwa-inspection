// src/components/admin/NotificationManager.tsx
import React, { useState, useEffect } from 'react';
import { Bell, Mail, Smartphone, Calendar, Clock, Users } from 'lucide-react';

const NotificationManager: React.FC = () => {
  const [schedules, setSchedules] = useState([]);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState(null);

  const [scheduleForm, setScheduleForm] = useState({
    type: 'both',
    recipients: 'all',
    frequency: 'monthly',
    dayOfMonth: 1,
    time: '09:00',
    template: {
      subject: 'Monthly Inspection Reminder',
      body: 'Hello {{userName}},\n\nThis is a reminder to complete your monthly inspection for {{currentMonth}}.\n\nPlease login to the inspection platform to submit your report by {{dueDate}}.\n\nThank you!',
    },
  });

  useEffect(() => {
    fetchSchedules();
  }, []);

  const fetchSchedules = async () => {
    const response = await fetch('/api/admin/notifications/schedules');
    const data = await response.json();
    setSchedules(data.schedules);
  };

  const saveSchedule = async () => {
    const method = editingSchedule ? 'PUT' : 'POST';
    const url = editingSchedule
      ? `/api/admin/notifications/schedules/${editingSchedule.id}`
      : '/api/admin/notifications/schedule';

    const response = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(scheduleForm),
    });

    if (response.ok) {
      fetchSchedules();
      setShowScheduleModal(false);
      resetForm();
    }
  };

  const testNotification = async (schedule) => {
    const response = await fetch('/api/admin/notifications/test', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(schedule),
    });

    if (response.ok) {
      alert('Test notification sent successfully!');
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Notification Manager</h1>
          <p className="text-gray-600 mt-1">Schedule and manage inspection reminders</p>
        </div>
        <button
          onClick={() => setShowScheduleModal(true)}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Bell className="w-4 h-4 mr-2" />
          New Schedule
        </button>
      </div>

      {/* Active Schedules */}
      <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4">Active Notification Schedules</h2>

        <div className="space-y-4">
          {schedules
            .filter((s) => s.active)
            .map((schedule) => (
              <div key={schedule.id} className="border rounded-lg p-4">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center mb-2">
                      <h3 className="font-medium text-lg">{schedule.template.subject}</h3>
                      <span
                        className={`ml-3 px-2 py-1 text-xs rounded-full ${
                          schedule.active
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {schedule.active ? 'Active' : 'Paused'}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600">
                      <div className="flex items-center">
                        {schedule.type === 'email' && <Mail className="w-4 h-4 mr-1" />}
                        {schedule.type === 'push' && <Smartphone className="w-4 h-4 mr-1" />}
                        {schedule.type === 'both' && (
                          <>
                            <Mail className="w-4 h-4 mr-1" />
                            <Smartphone className="w-4 h-4 mr-1" />
                          </>
                        )}
                        <span>{schedule.type}</span>
                      </div>

                      <div className="flex items-center">
                        <Users className="w-4 h-4 mr-1" />
                        <span>{schedule.recipient === 'all' ? 'All Users' : 'Selected'}</span>
                      </div>

                      <div className="flex items-center">
                        <Calendar className="w-4 h-4 mr-1" />
                        <span>{schedule.schedule.frequency}</span>
                      </div>

                      <div className="flex items-center">
                        <Clock className="w-4 h-4 mr-1" />
                        <span>{schedule.schedule.time}</span>
                      </div>
                    </div>

                    {schedule.lastSent && (
                      <p className="text-sm text-gray-500 mt-2">
                        Last sent: {new Date(schedule.lastSent).toLocaleString()}
                      </p>
                    )}

                    <p className="text-sm text-blue-600 mt-1">
                      Next scheduled: {new Date(schedule.nextScheduled).toLocaleString()}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => testNotification(schedule)}
                      className="px-3 py-1 text-sm text-gray-600 hover:text-gray-900"
                    >
                      Test
                    </button>
                    <button
                      onClick={() => editSchedule(schedule)}
                      className="px-3 py-1 text-sm text-blue-600 hover:text-blue-900"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => toggleSchedule(schedule.id)}
                      className="px-3 py-1 text-sm text-yellow-600 hover:text-yellow-900"
                    >
                      {schedule.active ? 'Pause' : 'Resume'}
                    </button>
                    <button
                      onClick={() => deleteSchedule(schedule.id)}
                      className="px-3 py-1 text-sm text-red-600 hover:text-red-900"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
        </div>

        {schedules.filter((s) => s.active).length === 0 && (
          <div className="text-center py-12 text-gray-500">
            <Bell className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p>No active notification schedules</p>
            <p className="text-sm mt-2">Create a schedule to start sending reminders</p>
          </div>
        )}
      </div>

      {/* Notification Templates */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-lg font-semibold mb-4">Notification Templates</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="border rounded-lg p-4">
            <h3 className="font-medium mb-2">Monthly Inspection Reminder</h3>
            <p className="text-sm text-gray-600">
              Sent on the 1st of each month to remind users about their monthly inspection
            </p>
          </div>

          <div className="border rounded-lg p-4">
            <h3 className="font-medium mb-2">Overdue Inspection Alert</h3>
            <p className="text-sm text-gray-600">
              Sent when an inspection is overdue by more than 3 days
            </p>
          </div>

          <div className="border rounded-lg p-4">
            <h3 className="font-medium mb-2">Inspection Completed</h3>
            <p className="text-sm text-gray-600">Sent to admins when inspections are completed</p>
          </div>

          <div className="border rounded-lg p-4">
            <h3 className="font-medium mb-2">Compliance Report</h3>
            <p className="text-sm text-gray-600">Weekly summary of compliance rates and issues</p>
          </div>
        </div>
      </div>

      {/* Schedule Modal */}
      {showScheduleModal && (
        <NotificationScheduleModal
          schedule={scheduleForm}
          onChange={setScheduleForm}
          onSave={saveSchedule}
          onClose={() => {
            setShowScheduleModal(false);
            resetForm();
          }}
        />
      )}
    </div>
  );
};
