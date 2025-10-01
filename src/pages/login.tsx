// src/pages/login.tsx
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { useAuth } from '@/hooks/useAuth';

const LoginPage: React.FC = () => {
  const [pin, setPin] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showDemo, setShowDemo] = useState(false);
  const router = useRouter();

  // Initialize auth hook safely
  let authHook;
  try {
    authHook = useAuth();
  } catch (error) {
    console.error('Auth context not available:', error);
    authHook = null;
  }

  const { login, isAuthenticated } = authHook || { login: null, isAuthenticated: false };

  useEffect(() => {
    if (isAuthenticated && router && router.isReady) {
      // Prevent redirect loops
      const currentPath = router.pathname;
      if (currentPath === '/login') {
        router.replace('/');
      }
    }
  }, [isAuthenticated, router]);

  const handlePinInput = (digit: string) => {
    if (pin.length < 4) {
      setPin((prev) => prev + digit);
      setError('');
    }
  };

  const handleDelete = () => {
    setPin((prev) => prev.slice(0, -1));
    setError('');
  };

  const handleSubmit = async () => {
    if (!login) {
      setError('Authentication system not available');
      return;
    }

    if (pin.length !== 4) {
      setError('Please enter a 4-digit PIN');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const success = await login(pin);
      if (success && authHook?.user) {
        // Role-based redirect
        const { user } = authHook;
        if (user.role === 'admin') {
          await router.replace('/admin');
        } else if (user.role === 'inspector') {
          await router.replace('/analytics');
        } else if (user.role === 'devsecops') {
          await router.replace('/devsecops');
        } else {
          await router.replace('/');
        }
      } else {
        setError('Invalid PIN. Please try again.');
        setPin('');
      }
    } catch (error) {
      setError('Login failed. Please try again.');
      setPin('');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key >= '0' && e.key <= '9') {
        handlePinInput(e.key);
      } else if (e.key === 'Backspace') {
        handleDelete();
      } else if (e.key === 'Enter' && pin.length === 4) {
        handleSubmit();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [pin]);

  const demoUsers = [
    { name: 'Admin User', pin: '1234', role: 'admin' },
    { name: 'Inspector Demo', pin: '9999', role: 'inspector' },
    { name: 'DevSecOps User', pin: '7777', role: 'devsecops' },
  ];

  // If auth is not available, show an error
  if (!authHook) {
    return (
      <>
        <Head>
          <title>Login - HSE Inspection System</title>
          <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
        </Head>
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-lg p-6 max-w-md w-full">
            <div className="text-center">
              <h1 className="text-2xl font-bold text-gray-900 mb-4">System Error</h1>
              <p className="text-gray-600">
                Authentication system is not properly configured. Please check your setup.
              </p>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Head>
        <title>Login - HSE Inspection System</title>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center">
              <img src="/theta-logo.png" alt="Theta Logo" className="w-40 h-40 object-contain" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 -mt-8">Inspection Platform</h1>
            <p className="text-gray-600 mt-2">Enter your 4-digit PIN to access</p>
          </div>

          {/* Login Card */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            {/* PIN Display */}
            <div className="flex justify-center mb-6">
              <div className="flex space-x-3">
                {[0, 1, 2, 3].map((index) => (
                  <div
                    key={index}
                    className={`w-12 h-12 rounded-lg border-2 flex items-center justify-center text-xl font-semibold transition-colors ${
                      pin.length > index
                        ? 'border-blue-500 bg-blue-50 text-blue-600'
                        : 'border-gray-200 bg-gray-50 text-gray-400'
                    }`}
                  >
                    {pin.length > index ? '●' : ''}
                  </div>
                ))}
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-600 text-sm text-center">{error}</p>
              </div>
            )}

            {/* Numeric Keypad */}
            <div className="grid grid-cols-3 gap-3 mb-4">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((digit) => (
                <button
                  key={digit}
                  type="button"
                  onClick={() => handlePinInput(digit.toString())}
                  disabled={isLoading || pin.length >= 4}
                  className="h-14 bg-gray-50 hover:bg-gray-100 active:bg-gray-200 rounded-lg text-xl font-semibold text-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {digit}
                </button>
              ))}

              <button
                type="button"
                onClick={handleDelete}
                disabled={isLoading || pin.length === 0}
                className="h-14 bg-gray-50 hover:bg-gray-100 active:bg-gray-200 rounded-lg text-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2M3 12l6.414 6.414a2 2 0 001.414.586H19a2 2 0 002-2V7a2 2 0 00-2-2h-8.172a2 2 0 00-1.414.586L3 12z"
                  />
                </svg>
              </button>

              <button
                type="button"
                onClick={() => handlePinInput('0')}
                disabled={isLoading || pin.length >= 4}
                className="h-14 bg-gray-50 hover:bg-gray-100 active:bg-gray-200 rounded-lg text-xl font-semibold text-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                0
              </button>

              <button
                type="button"
                onClick={handleSubmit}
                disabled={isLoading || pin.length !== 4}
                className="h-14 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {isLoading ? (
                  <div className="animate-spin rounded-full h-6 w-6 border-2 border-white border-t-transparent" />
                ) : (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 7l5 5m0 0l-5 5m5-5H6"
                    />
                  </svg>
                )}
              </button>
            </div>

            {/* Demo Info Toggle */}
            <div className="text-center">
              <button
                onClick={() => setShowDemo(!showDemo)}
                className="text-sm text-blue-600 hover:text-blue-700 underline"
              >
                {showDemo ? 'Hide' : 'Show'} Demo Accounts
              </button>
            </div>

            {/* Demo Accounts */}
            {showDemo && (
              <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                <h3 className="text-sm font-semibold text-gray-700 mb-3">Demo Accounts:</h3>
                <div className="space-y-2">
                  {demoUsers.map((user) => (
                    <div
                      key={user.pin}
                      className="flex justify-between items-center p-2 bg-white rounded border cursor-pointer hover:bg-gray-50"
                      onClick={() => setPin(user.pin)}
                    >
                      <div>
                        <div className="text-sm font-medium text-gray-900">{user.name}</div>
                        <div className="text-xs text-gray-500 capitalize">{user.role}</div>
                      </div>
                      <div className="text-sm font-mono text-gray-600">PIN: {user.pin}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="text-center mt-6">
            <p className="text-sm text-gray-500">Secure access for inspection personnel only</p>
          </div>
        </div>
      </div>
    </>
  );
};

export default LoginPage;
