'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  Home, 
  CreditCard, 
  Package, 
  Settings, 
  DollarSign, 
  FileText,
  Zap,
  Activity,
  Factory,
  BarChart3
} from 'lucide-react';

const navItems = [
  { href: '/admin', label: 'Dashboard', icon: Home },
  { href: '/admin/autopilot', label: 'Autopilot', icon: Zap },
  { href: '/admin/ecosystem-health', label: 'Health', icon: Activity },
  { href: '/admin/module-factory', label: 'Factory', icon: Factory },
  { href: '/admin/apps', label: 'Apps', icon: Package },
  { href: '/admin/credits', label: 'Credits', icon: CreditCard },
  { href: '/admin/analytics', label: 'Analytics', icon: BarChart3 },
  { href: '/admin/assets', label: 'Assets', icon: FileText },
  { href: '/admin/billing', label: 'Billing', icon: DollarSign },
  { href: '/admin/settings', label: 'Settings', icon: Settings },
];

export function AdminNavigation() {
  const pathname = usePathname();

  return (
    <nav className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <Link href="/" className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-cyan-500 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">CR</span>
                </div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-cyan-500 bg-clip-text text-transparent">
                  CR AudioViz AI Admin
                </h1>
              </Link>
            </div>
            <div className="hidden sm:ml-8 sm:flex sm:space-x-4">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href || pathname?.startsWith(item.href + '/');
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`inline-flex items-center px-2 pt-1 border-b-2 text-sm font-medium transition-colors ${
                      isActive
                        ? 'border-blue-600 text-gray-900'
                        : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                    }`}
                  >
                    <Icon className="w-4 h-4 mr-1" />
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </div>
          <div className="flex items-center">
            <Link
              href="/apps"
              className="text-sm font-medium text-gray-700 hover:text-gray-900"
            >
              ← Back to Apps
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}
