// src/pages/api/admin/users.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { generateSecurePIN, hashPIN } from '@/utils/auth';
import { sendEmail } from '@/utils/email';

// GET /api/admin/users - List all users with filters
export async function getUsers(req: NextApiRequest, res: NextApiResponse) {
  const { role, status, search, page = 1, limit = 10 } = req.query;

  try {
    const users = storage.load('users', []);
    let filtered = users;

    if (role) filtered = filtered.filter((u) => u.role === role);
    if (status) filtered = filtered.filter((u) => u.isActive === (status === 'active'));
    if (search) {
      filtered = filtered.filter(
        (u) =>
          u.name.toLowerCase().includes(search.toLowerCase()) ||
          u.email?.toLowerCase().includes(search.toLowerCase()),
      );
    }

    // Add performance metrics
    const enrichedUsers = filtered.map((user) => ({
      ...user,
      performanceMetrics: calculateUserPerformance(user.id),
    }));

    const paginated = enrichedUsers.slice((page - 1) * limit, page * limit);

    res.status(200).json({
      users: paginated,
      total: filtered.length,
      page,
      totalPages: Math.ceil(filtered.length / limit),
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch users' });
  }
}

// POST /api/admin/users - Create new user
export async function createUser(req: NextApiRequest, res: NextApiResponse) {
  const { name, email, role, department, permissions } = req.body;

  try {
    const newPIN = generateSecurePIN();
    const hashedPIN = hashPIN(newPIN);

    const newUser: EnhancedUser = {
      id: Date.now().toString(),
      name,
      email,
      pin: hashedPIN,
      role,
      department,
      permissions,
      isActive: true,
      createdAt: new Date().toISOString(),
      notificationPreferences: {
        email: true,
        push: true,
        sms: false,
      },
      performanceMetrics: {
        totalInspections: 0,
        completedInspections: 0,
        averageCompletionTime: 0,
        lastActiveDate: new Date(),
      },
      pinResetHistory: [],
    };

    const users = storage.load('users', []);
    users.push(newUser);
    storage.save('users', users);

    // Send welcome email with PIN
    if (email) {
      await sendEmail({
        to: email,
        subject: 'Welcome to HSE Inspection Platform',
        template: 'welcome',
        variables: {
          userName: name,
          pin: newPIN,
          loginUrl: `${process.env.NEXT_PUBLIC_APP_URL}/login`,
        },
      });
    }

    res.status(201).json({
      user: { ...newUser, pin: undefined }, // Don't send hashed PIN
      tempPIN: newPIN, // Send temporary PIN for display
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create user' });
  }
}

// PUT /api/admin/users/:id/reset-pin
export async function resetUserPIN(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;
  const { reason, notifyUser = true } = req.body;
  const adminUser = req.session.user; // Assuming session middleware

  try {
    const users = storage.load('users', []);
    const userIndex = users.findIndex((u) => u.id === id);

    if (userIndex === -1) {
      return res.status(404).json({ error: 'User not found' });
    }

    const newPIN = generateSecurePIN();
    const hashedPIN = hashPIN(newPIN);

    users[userIndex].pin = hashedPIN;
    users[userIndex].pinResetHistory = [
      ...(users[userIndex].pinResetHistory || []),
      {
        resetBy: adminUser.name,
        resetAt: new Date().toISOString(),
        reason,
      },
    ];

    storage.save('users', users);

    if (notifyUser && users[userIndex].email) {
      await sendEmail({
        to: users[userIndex].email,
        subject: 'Your PIN has been reset',
        template: 'pin-reset',
        variables: {
          userName: users[userIndex].name,
          newPin: newPIN,
          reason,
        },
      });
    }

    res.status(200).json({
      message: 'PIN reset successfully',
      tempPIN: newPIN,
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to reset PIN' });
  }
}
