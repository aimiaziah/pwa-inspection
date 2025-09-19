import React from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';

interface BaseLayoutProps {
  children: React.ReactNode;
  title?: string;
  description?: string;
}

const BaseLayout: React.FC<BaseLayoutProps> = ({
  children,
  title = 'PWA Inspection Checklist',
  description = 'A comprehensive checklist for Progressive Web Applications',
}) => {
  const router = useRouter();

  const navItems = [
    { href: '/', label: 'Home' },
    { href: '/hse-inspection', label: 'Checklist' },
    { href: '/saved', label: 'Saved' },
    { href: '/about', label: 'About' },
    { href: '/admin', label: 'Admin ⚙️' }, // ADD THIS LINE
  ];

  return (
    <>
      <Head>
        <title>{title}</title>
        <meta name="description" content={description} />
        <meta name="theme-color" content="#feda4c" />
      </Head>

      <div className="min-h-screen bg-white">
        {/* Header with Admin Button */}
        <header className="bg-yellow-400 border-b-4 border-gray-900">
          <div className="max-w-4xl mx-auto px-4 py-6">
            <div className="flex justify-between items-start">
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-gray-900">PWA Checklist</h1>
                <p className="text-gray-600 mt-2">Your complete inspection guide</p>
              </div>
              <Link href="/admin">
                <span>⚙️</span>
                <span>Admin</span>
              </Link>
            </div>
          </div>
        </header>

        {/* Navigation */}
        <nav className="bg-gray-50 border-b border-gray-200">
          <div className="max-w-4xl mx-auto px-4">
            <div className="flex space-x-8 py-4">
              {navItems.map((item) => (
                <Link key={item.href} href={item.href}>
                  {/*
                    className={`
                    text-gray-700 hover:text-gray-900 transition-colors
                    ${
                      router.pathname.startsWith(item.href) && item.href !== '/'
                        ? 'font-semibold text-gray-900'
                        : router.pathname === item.href
                        ? 'font-semibold text-gray-900'
                        : ''
                    }
                  `} */}

                  {item.label}
                </Link>
              ))}
            </div>
          </div>
        </nav>

        {/* Main Content */}
        <main className="max-w-4xl mx-auto px-4 py-8">{children}</main>
      </div>
    </>
  );
};

export default BaseLayout;
