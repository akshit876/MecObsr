/* eslint-disable react/prop-types */
'use client';

import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Home,
  Settings,
  Hash,
  Clock,
  RotateCcw,
  LogOut,
  ChevronDown,
  ChevronRight,
  ChevronLeft,
  Image,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useProtectedRoute } from '../../../hooks/useProtectedRoute';
import React, { useState } from 'react';

import { toast } from 'react-toastify';
import { signOut } from 'next-auth/react';

export default function TestSidebar({ isCollapsed, setIsCollapsed }) {
  const pathname = usePathname();
  const router = useRouter();
  const { session } = useProtectedRoute();
  const [expandedSections, setExpandedSections] = useState({});
  // const [isCollapsed, setIsCollapsed] = useState(false);

  const toggleSection = (label) => {
    setExpandedSections((prev) => ({
      ...prev,
      [label]: !prev[label],
    }));
  };

  const routes = [
    {
      label: 'Dashboard',
      href: '/',
      icon: Home,
    },
    {
      label: 'Image Search',
      href: '/image-search',
      icon: Image,
    },
    ...(session?.user?.role === 'admin'
      ? [
          {
            label: 'Settings',
            href: '/settings',
            icon: Settings,
            children: [
              {
                label: 'Part Number Config',
                href: '/part-number-config',
                icon: Hash,
              },
              {
                label: 'Shift Config',
                href: '/shift-config',
                icon: Clock,
              },
              {
                label: 'Serial Configuration',
                href: '/serial-config',
                icon: RotateCcw,
              },
              {
                label: 'Servo Settings',
                href: '/servo-settings',
                icon: RotateCcw,
              },
              {
                label: 'Manual Run',
                href: '/manual-mode',
                icon: RotateCcw,
              },
            ],
          },
        ]
      : []),
  ];

  return (
    <>
      {/* Toggle Button - Updated positioning and styling */}
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className={cn(
          'fixed z-50 p-1.5 rounded-full shadow-lg border border-gray-800 bg-[#1e1b2c] transition-all duration-300',
          isCollapsed ? 'left-[60px] -translate-x-1/2' : 'left-[240px] -translate-x-1/2',
        )}
        style={{ top: '20px' }}
      >
        <ChevronLeft
          className={cn(
            'h-4 w-4 text-gray-300 transition-transform duration-300',
            isCollapsed && 'rotate-180',
          )}
        />
      </button>

      <div
        className={cn(
          'fixed top-0 left-0 h-screen bg-[#1e1b2c] flex flex-col transition-all duration-300',
          isCollapsed ? 'w-[60px]' : 'w-[240px]',
        )}
      >
        {/* Logo Section */}
        <div className="h-[60px] flex items-center px-6 border-b border-gray-800">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-indigo-500 rounded flex items-center justify-center">
              <span className="text-white text-sm font-semibold">R</span>
            </div>
            {!isCollapsed && <span className="font-semibold text-white">RICO</span>}
          </div>
        </div>

        {/* Search Bar - Only show when expanded */}
        {!isCollapsed && (
          <div className="px-4 py-3">
            <div className="relative">
              <input
                type="text"
                placeholder="Search..."
                className="w-full bg-[#2d2a3d] text-gray-300 text-sm rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-indigo-500 border border-gray-700"
              />
            </div>
          </div>
        )}

        {/* Navigation */}
        <ScrollArea className={cn('flex-1', isCollapsed ? 'px-1' : 'px-2')}>
          <nav className="space-y-1">
            {routes.map((route) => (
              <React.Fragment key={route.label}>
                {route.children ? (
                  <div>
                    <button
                      onClick={() => toggleSection(route.label)}
                      className={cn(
                        'w-full flex items-center justify-between px-3 py-2 rounded-md text-sm font-medium transition-colors',
                        expandedSections[route.label]
                          ? 'bg-[#2d2a3d] text-indigo-400'
                          : 'text-gray-300 hover:bg-[#2d2a3d]',
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <route.icon className="h-4 w-4" />
                        {!isCollapsed && route.label}
                      </div>
                      {!isCollapsed && (
                        <ChevronDown
                          className={cn(
                            'h-4 w-4 transition-transform',
                            expandedSections[route.label] ? 'transform rotate-180' : '',
                          )}
                        />
                      )}
                    </button>
                    {expandedSections[route.label] && !isCollapsed && (
                      <div className="mt-1 ml-4 space-y-1">
                        {route.children.map((child) => (
                          <Link
                            key={child.href}
                            href={child.href}
                            className={cn(
                              'flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors',
                              pathname === child.href
                                ? 'bg-[#2d2a3d] text-indigo-400'
                                : 'text-gray-300 hover:bg-[#2d2a3d]',
                            )}
                          >
                            <child.icon className="h-4 w-4" />
                            {!isCollapsed && child.label}
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <Link
                    href={route.href}
                    className={cn(
                      'flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors',
                      pathname === route.href
                        ? 'bg-[#2d2a3d] text-indigo-400'
                        : 'text-gray-300 hover:bg-[#2d2a3d]',
                    )}
                  >
                    <route.icon className="h-4 w-4" />
                    {!isCollapsed && route.label}
                  </Link>
                )}
              </React.Fragment>
            ))}
          </nav>
        </ScrollArea>

        {/* User Section - Simplified when collapsed */}
        <div className={cn('border-t border-gray-800', isCollapsed ? 'p-2' : 'p-4')}>
          {isCollapsed ? (
            <div className="w-8 h-8 rounded-full bg-[#2d2a3d] flex items-center justify-center">
              <span className="text-sm font-medium text-gray-300">
                {session?.user?.name?.[0] || 'U'}
              </span>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-[#2d2a3d] flex items-center justify-center">
                  <span className="text-sm font-medium text-gray-300">
                    {session?.user?.name?.[0] || 'U'}
                  </span>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-200">
                    {session?.user?.name || 'User Name'}
                  </p>
                  <p className="text-xs text-gray-400">
                    {session?.user?.email || 'user@example.com'}
                  </p>
                </div>
              </div>
              <button
                className="mt-2 flex items-center gap-2 text-sm text-gray-300 hover:text-white w-full px-2 py-2 rounded-md hover:bg-[#2d2a3d]"
                onClick={async () => {
                  try {
                    // First, call the logout API to log the session end
                    const response = await fetch('/api/auth/logout', {
                      method: 'POST',
                      headers: {
                        'Content-Type': 'application/json',
                      },
                    });

                    if (!response.ok) {
                      throw new Error('Failed to log logout');
                    }

                    // Clear any local state
                    // clearModel();

                    // Then perform NextAuth signOut
                    await signOut({ redirect: false });

                    // Finally redirect to login page
                    router.push('/login');
                    toast.success('Logged out successfully');
                  } catch (error) {
                    console.error('Logout error:', error);
                    toast.error('Error during logout');

                    // Still attempt to sign out and redirect even if logging fails
                    // clearModel();
                    await signOut({ redirect: false });
                    router.push('/login');
                  }
                }}
              >
                <LogOut className="h-4 w-4" />
                Log out
              </button>
            </>
          )}
        </div>
      </div>
    </>
  );
}
