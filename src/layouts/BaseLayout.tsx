import React from 'react';
import Head from 'next/head';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/router';


interface BaseLayoutProps {
  children: React.ReactNode;
  title?: string;
  description?: string;
}

const BaseLayout: React.FC<BaseLayoutProps> = ({
  children,
  title = 'HSE Inspection System',
  description = 'Comprehensive Health, Safety & Environment inspection management system',
}) => {
  const router = useRouter();

  const navItems = [
    {
      href: '/',
      label: 'Dashboard',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z"
          />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M8 5a2 2 0 012-2h4a2 2 0 012 2v6H8V5z"
          />
        </svg>
      ),
      description: 'Overview and quick actions',
    },
    {
      href: '/inspections',
      label: 'Inspections',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"
          />
        </svg>
      ),
      description: 'All inspection types',
      subItems: [
        {
          href: '/hse-inspection',
          label: 'HSE Inspection',
          icon: (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          ),
        },
        {
          href: '/fire-extinguisher',
          label: 'Fire Extinguisher',
          icon: (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z"
              />
            </svg>
          ),
        },
        {
          href: '/first-aid',
          label: 'First Aid Kit',
          icon: (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
              />
            </svg>
          ),
        },
      ],
    },
    {
      href: '/saved',
      label: 'Reports',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          />
        </svg>
      ),
      description: 'View and manage completed inspections',
    },
    {
      href: '/approval-workflow',
      label: 'Approvals',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      ),
      description: 'Review pending inspections',
    },
    {
      href: '/analytics',
      label: 'Analytics',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
          />
        </svg>
      ),
      description: 'Trends and compliance metrics',
    },
  ];

  const isActivePath = (path: string) => {
    if (path === '/') {
      return router.pathname === '/';
    }
    return router.pathname.startsWith(path);
  };

  const [showMobileMenu, setShowMobileMenu] = React.useState(false);
  const [showInspectionsDropdown, setShowInspectionsDropdown] = React.useState(false);

  return (
    <>
      <Head>
        <title>{title}</title>
        <meta name="description" content={description} />
        <meta name="theme-color" content="#2563eb" />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5" />

        {/* PWA Meta Tags */}
        <link rel="manifest" href="/manifest.json" />
        <link rel="apple-touch-icon" href="/icon-192x192.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="HSE Inspector" />
      </Head>

      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-40">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              {/* Logo and Title */}
              <div className="flex items-center">
                <Link href="/" className="flex items-center space-x-3">
                  <div className="w-12 h-12 rounded-lg overflow-hidden">
                    <Image
                      src="/theta-logo.png"
                      alt="Company Logo"
                      width={100}
                      height={40}
                      className="object-contain sm:w-28 sm:h-auto w-20"
                    />
                  </div>
                  <div>
                    <h1 className="text-xl font-bold text-gray-900">Inspection Platform</h1>
                    <p className="text-xs text-gray-500 hidden sm:block">Theta Edge Berhad</p>
                  </div>
                </Link>
              </div>

              {/* Desktop Navigation */}
              <nav className="hidden lg:flex space-x-1">
                {navItems.map((item) => (
                  <div key={item.href} className="relative">
                    {item.subItems ? (
                      <div
                        className="relative"
                        onMouseEnter={() => setShowInspectionsDropdown(true)}
                        onMouseLeave={() => setShowInspectionsDropdown(false)}
                      >
                        <button
                          className={`
                          px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center space-x-2
                          ${
                            isActivePath(item.href)
                              ? 'bg-blue-50 text-blue-700'
                              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                          }
                        `}
                        >
                          {item.icon}
                          <span>{item.label}</span>
                          <svg
                            className="w-4 h-4 ml-1"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M19 9l-7 7-7-7"
                            />
                          </svg>
                        </button>

                        {/* Dropdown Menu */}
                        {showInspectionsDropdown && (
                          <div className="absolute top-full left-0 mt-2 w-56 bg-white rounded-lg shadow-lg ring-1 ring-black ring-opacity-5 z-50">
                            <div className="py-2">
                              {item.subItems.map((subItem) => (
                                <Link
                                  key={subItem.href}
                                  href={subItem.href}
                                  className="flex items-center space-x-3 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                                >
                                  {subItem.icon}
                                  <span>{subItem.label}</span>
                                </Link>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <Link
                        href={item.href}
                        className={`
                          px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center space-x-2
                          ${
                            isActivePath(item.href)
                              ? 'bg-blue-50 text-blue-700'
                              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                          }
                        `}
                      >
                        {item.icon}
                        <span>{item.label}</span>
                      </Link>
                    )}
                  </div>
                ))}
              </nav>

              {/* Mobile menu button */}
              <button
                onClick={() => setShowMobileMenu(!showMobileMenu)}
                className="lg:hidden p-2 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-50 touch-manipulation"
              >
                {showMobileMenu ? (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                ) : (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 6h16M4 12h16M4 18h16"
                    />
                  </svg>
                )}
              </button>
            </div>
          </div>

          {/* Mobile Navigation */}
          {showMobileMenu && (
            <div className="lg:hidden border-t border-gray-200 bg-white">
              <div className="px-4 py-3 space-y-1">
                {navItems.map((item) => (
                  <div key={item.href}>
                    {item.subItems ? (
                      <>
                        <div className="px-3 py-3 text-sm font-medium text-gray-800 border-b border-gray-100">
                          <div className="flex items-center space-x-3">
                            {item.icon}
                            <span>{item.label}</span>
                          </div>
                        </div>
                        {item.subItems.map((subItem) => (
                          <Link
                            key={subItem.href}
                            href={subItem.href}
                            className="flex items-center space-x-3 px-6 py-3 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-50 touch-manipulation"
                            onClick={() => setShowMobileMenu(false)}
                          >
                            {subItem.icon}
                            <span>{subItem.label}</span>
                          </Link>
                        ))}
                      </>
                    ) : (
                      <Link
                        href={item.href}
                        className={`
                          flex items-center space-x-3 px-3 py-3 rounded-lg text-sm font-medium touch-manipulation min-h-[44px]
                          ${
                            isActivePath(item.href)
                              ? 'bg-blue-50 text-blue-700'
                              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                          }
                        `}
                        onClick={() => setShowMobileMenu(false)}
                      >
                        {item.icon}
                        <div>
                          <div>{item.label}</div>
                          <div className="text-xs text-gray-500">{item.description}</div>
                        </div>
                      </Link>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </header>

        {/* Breadcrumb */}
        {router.pathname !== '/' && (
          <div className="bg-white border-b border-gray-200">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
              <nav className="flex" aria-label="Breadcrumb">
                <ol className="flex items-center space-x-2 text-sm">
                  <li>
                    <Link href="/" className="text-gray-500 hover:text-gray-700 flex items-center">
                      <svg
                        className="w-4 h-4 mr-1"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z"
                        />
                      </svg>
                      Dashboard
                    </Link>
                  </li>
                  <li className="flex items-center">
                    <svg
                      className="w-4 h-4 text-gray-400 mx-2"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <span className="text-gray-900 font-medium">
                      {navItems.find(
                        (item) =>
                          item.href === router.pathname ||
                          item.subItems?.some((sub) => sub.href === router.pathname),
                      )?.label ||
                        navItems
                          .find((item) =>
                            item.subItems?.some((sub) => sub.href === router.pathname),
                          )
                          ?.subItems?.find((sub) => sub.href === router.pathname)?.label ||
                        'Current Page'}
                    </span>
                  </li>
                </ol>
              </nav>
            </div>
          </div>
        )}

        {/* Main Content */}
        <main className="px-4 sm:px-6 lg:px-8 py-6">{children}</main>

        {/* Footer */}
        <footer className="bg-white border-t border-gray-200 mt-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div>
                <div className="flex items-center space-x-2 mb-3">
                  <div className="w-6 h-6 bg-blue-600 rounded flex items-center justify-center">
                    <svg
                      className="w-4 h-4 text-white"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                      />
                    </svg>
                  </div>
                  <h3 className="text-sm font-semibold text-gray-900">HSE Inspector</h3>
                </div>
                <p className="text-sm text-gray-600">
                  Comprehensive health, safety, and environment inspection management with
                  role-based approvals and analytics.
                </p>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-3">Quick Links</h3>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li>
                    <Link href="/hse-inspection" className="hover:text-gray-900">
                      HSE Inspection
                    </Link>
                  </li>
                  <li>
                    <Link href="/fire-extinguisher" className="hover:text-gray-900">
                      Fire Extinguisher
                    </Link>
                  </li>
                  <li>
                    <Link href="/first-aid" className="hover:text-gray-900">
                      First Aid Kit
                    </Link>
                  </li>
                  <li>
                    <Link href="/analytics" className="hover:text-gray-900">
                      Analytics
                    </Link>
                  </li>
                </ul>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-3">System Info</h3>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li>Version 2.0.0</li>
                  <li>PWA Enabled</li>
                  <li>Offline Support</li>
                  <li>
                    <Link href="/audit-trail" className="hover:text-gray-900">
                      Audit Trail
                    </Link>
                  </li>
                </ul>
              </div>
            </div>

            <div className="mt-8 pt-8 border-t border-gray-200 text-center">
              <p className="text-sm text-gray-500">
                © 2025 HSE Inspection System. Built for safety and compliance.
              </p>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
};

export default BaseLayout;
