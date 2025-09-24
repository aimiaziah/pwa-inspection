import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';

interface MobileTabBarProps {
  className?: string;
}

const MobileTabBar: React.FC<MobileTabBarProps> = ({ className = '' }) => {
  const router = useRouter();

  const tabs = [
    { href: '/', label: 'Home', icon: '🏠' },
    { href: '/hse-inspection', label: 'Checklist', icon: '✓' },
    { href: '/saved', label: 'Saved', icon: '⭐' },
    { href: '/about', label: 'About', icon: 'ℹ️' },
  ];

  return (
    <div
      className={`fixed bottom-0 left-0 right-0 bg-bits-white border-t border-gray-200 ${className}`}
    >
      <nav className="flex justify-around">
        {tabs.map((tab) => (
          <Link key={tab.href} href={tab.href}>

            <span className="text-xl mb-1">{tab.icon}</span>
            <span className="text-xs">{tab.label}</span>
          </Link>
        ))}
      </nav>
    </div>
  );
};

export default MobileTabBar;
