'use client';

import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Home,
  Settings,
  ChevronRight,
  MenuIcon,
  Hash,
  ChevronDown,
  Clock,
  TicketCheckIcon,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useProtectedRoute } from '../../../hooks/useProtectedRoute';
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';

export default function TestSidebar() {
  const pathname = usePathname();
  const [active, setActive] = useState('Dashboard');
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [openMenus, setOpenMenus] = useState({});
  const { session } = useProtectedRoute();

  const toggleMenu = (menuLabel) => {
    setOpenMenus((prev) => ({
      ...prev,
      [menuLabel]: !prev[menuLabel],
    }));
  };

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
            icon: Settings,
            isNested: true,
            children: [
              {
                label: 'Part Number Config',
                href: '/part-number-config',
                icon: Hash,
              },
              {
                label: 'Part Number Select',
                href: '/part-number-select',
                icon: TicketCheckIcon,
              },
              {
                label: 'Shift Config',
                href: '/shift-config',
                icon: Clock,
              },
            ],
          },
        ]
      : []),
  ];

  return (
    <div className="flex min-h-screen">
      <div
        className={cn(
          'fixed top-0 left-0 h-screen bg-[#1E1E2D] transition-all duration-300 overflow-y-auto',
          isCollapsed ? 'w-[80px]' : 'w-[280px]',
        )}
      >
        <div className="flex flex-col h-full">
          <div className="sticky top-0 h-[60px] flex items-center justify-between px-4 border-b border-[#2D2F3A] bg-[#1E1E2D] z-10">
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
          <ScrollArea className="flex-1 h-[calc(100vh-60px)]">
            <nav className="p-2 space-y-2">
              {routes.map((route) => (
                <React.Fragment key={route.label}>
                  {route.isNested ? (
                    <div className="space-y-2">
                      <button
                        onClick={() => !isCollapsed && toggleMenu(route.label)}
                        className={cn(
                          'w-full flex items-center gap-3 p-2 rounded-md transition-all',
                          pathname.startsWith(route.href) || openMenus[route.label]
                            ? 'bg-[#4B49AC] text-white'
                            : 'text-[#7DA0FA] hover:bg-[#2D2F3A]',
                        )}
                      >
                        <route.icon className="h-5 w-5 min-w-[20px]" />
                        {!isCollapsed && (
                          <>
                            <span className="font-medium">{route.label}</span>
                            <ChevronDown
                              className={cn(
                                'ml-auto h-4 w-4 transition-transform duration-200',
                                openMenus[route.label] && 'rotate-180',
                              )}
                            />
                          </>
                        )}
                      </button>
                      {!isCollapsed && openMenus[route.label] && (
                        <div className="pl-4 space-y-1">
                          {route.children.map((child) => (
                            <Link
                              key={child.href}
                              href={child.href}
                              onClick={() => setActive(child.label)}
                              className={cn(
                                'flex items-center gap-3 p-2 rounded-md transition-all text-sm',
                                pathname === child.href
                                  ? 'bg-[#4B49AC] text-white'
                                  : 'text-[#7DA0FA] hover:bg-[#2D2F3A]',
                              )}
                            >
                              <child.icon className="h-4 w-4 min-w-[16px]" />
                              <span className="font-medium">{child.label}</span>
                            </Link>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : (
                    <Link
                      href={route.href}
                      onClick={() => setActive(route.label)}
                      className={cn(
                        'flex items-center gap-3 p-2 rounded-md transition-all',
                        pathname === route.href
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
                  )}
                </React.Fragment>
              ))}
            </nav>
          </ScrollArea>
        </div>
      </div>
      <div
        className={cn(
          'flex-shrink-0 transition-all duration-300',
          isCollapsed ? 'w-[80px]' : 'w-[280px]',
        )}
      />
    </div>
  );
}
