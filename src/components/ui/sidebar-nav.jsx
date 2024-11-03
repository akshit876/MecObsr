'use client';

import { ScrollArea } from '@/components/ui/scroll-area';
import { Home, Settings, ChevronRight, MenuIcon } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { useProtectedRoute } from '@/hooks/useProtectedRoute';
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';

export function SidebarNav() {
  const [active, setActive] = useState('Dashboard');
  const [isCollapsed, setIsCollapsed] = useState(false);
  const { session } = useProtectedRoute();

  const routes = [
    {
      label: 'Dashboard',
      href: '/',
      icon: Home,
    },
    ...(session?.user?.role === 'admin'
      ? [
          {
            label: 'Settings',
            href: '/settings',
            icon: Settings,
          },
        ]
      : []),
  ];

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 h-screen bg-[#1E1E2D] transition-all duration-300',
        isCollapsed ? 'w-[80px]' : 'w-[280px]',
      )}
    >
      <div className="flex flex-col h-full">
        <div className="h-[60px] flex items-center justify-between px-4 border-b border-[#2D2F3A]">
          {!isCollapsed && <h1 className="text-2xl font-semibold text-white">RICO</h1>}
          <Button
            variant="ghost"
            size="icon"
            className="text-white hover:bg-[#2D2F3A]"
            onClick={() => setIsCollapsed(!isCollapsed)}
          >
            <MenuIcon className="h-5 w-5" />
          </Button>
        </div>
        <ScrollArea className="flex-1">
          <nav className="p-2 space-y-2">
            {routes.map((route) => (
              <Link
                key={route.href}
                href={route.href}
                onClick={() => setActive(route.label)}
                className={cn(
                  'flex items-center gap-3 p-2 rounded-md transition-all',
                  active === route.label
                    ? 'bg-[#4B49AC] text-white'
                    : 'text-[#7DA0FA] hover:bg-[#2D2F3A]',
                )}
              >
                <route.icon className="h-5 w-5 min-w-[20px]" />
                {!isCollapsed && (
                  <>
                    <span className="font-medium">{route.label}</span>
                    <ChevronRight className="ml-auto h-4 w-4" />
                  </>
                )}
              </Link>
            ))}
          </nav>
        </ScrollArea>
      </div>
    </aside>
  );
}
