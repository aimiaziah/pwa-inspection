// src/pages/api/auth/login.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { storage } from '@/utils/storage';
import { User } from '@/hooks/useAuth';
import { serialize } from 'cookie';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { pin } = req.body;

  if (!pin) {
    return res.status(400).json({ error: 'PIN is required' });
  }

  try {
    const users = storage.load('users', []) as User[];
    const foundUser = users.find((u) => u.pin === pin && u.isActive);

    if (!foundUser) {
      // Log failed login attempt
      logAuditEvent({
        action: 'LOGIN_FAILED',
        details: { reason: 'Invalid PIN or inactive user' },
        timestamp: new Date().toISOString(),
      });

      return res.status(401).json({ error: 'Invalid PIN' });
    }

    // Update last login
    const updatedUser = { ...foundUser, lastLogin: new Date().toISOString() };
    const updatedUsers = users.map((u) => (u.id === foundUser.id ? updatedUser : u));
    storage.save('users', updatedUsers);

    // Set auth token cookie (using user ID as token for demo)
    // In production, use JWT or proper session tokens
    const cookie = serialize('auth-token', foundUser.id, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/',
    });

    res.setHeader('Set-Cookie', cookie);

    // Log successful login
    logAuditEvent({
      action: 'LOGIN_SUCCESS',
      performedBy: foundUser.id,
      performedByName: foundUser.name,
      timestamp: new Date().toISOString(),
    });

    // Return user without PIN
    const sanitizedUser = { ...updatedUser, pin: undefined };

    return res.status(200).json({
      success: true,
      user: sanitizedUser,
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ error: 'Login failed' });
  }
}

function logAuditEvent(event: any) {
  const auditLogs = storage.load('auditLogs', []);
  auditLogs.push(event);

  if (auditLogs.length > 50000) {
    auditLogs.splice(0, auditLogs.length - 50000);
  }

  storage.save('auditLogs', auditLogs);
}
