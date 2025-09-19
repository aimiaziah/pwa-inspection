import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';

interface NavigationProps {
  className?: string;
}

const Navigation: React.FC<NavigationProps> = ({ className = '' }) => {
  const router = useRouter();

  const navItems = [
    { href: '/admin', label: 'Admin', icon: '⚙️' },
    { href: '/', label: 'Home', icon: '🏠' },
    { href: '/hse-inspection', label: 'Checklist', icon: '✓' },
    { href: '/saved', label: 'Saved', icon: '⭐' },
    { href: '/about', label: 'About', icon: 'ℹ️' },
  ];

  return (
    <nav className={`bg-bits-light-gray border-b border-gray-200 ${className}`}>
      <div className="max-w-4xl mx-auto px-4">
        <ul className="flex space-x-8">
          {navItems.map((item) => (
            <li key={item.href}>
              <Link href={item.href}>
                className=
                {`
                  inline-block py-4 px-2 border-b-2 transition-colors
                  ${
                    router.pathname === item.href
                      ? 'border-bits-yellow text-bits-dark font-semibold'
                      : 'border-transparent text-bits-gray hover:text-bits-dark hover:border-bits-yellow'
                  }
                `}
                <span className="mr-2">{item.icon}</span>
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </nav>
  );
};

export default Navigation;
