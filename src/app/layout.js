/* eslint-disable react/prop-types */
'use client';
import { ErrorToastHandler } from '@/comp/ErrorToasthandler';
import SidebarNav from './test-sidebar/page';
import React, { useState } from 'react';
import { Providers } from './providers';
import AuthProvider from './context/authprovider';
import './globals.css';
import TopBar from '@/components/TopBar';
import { cn } from '@/lib/utils';

export default function RootLayout({ children }) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          <Providers>
            <ErrorToastHandler />
            <div className="min-h-screen bg-gray-50">
              <div className="flex min-h-screen bg-gray-50">
                <SidebarNav isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
                <main
                  className={cn(
                    'flex-1 transition-all duration-300',
                    isCollapsed ? 'ml-[60px]' : 'ml-[240px]',
                  )}
                >
                  {children}
                </main>
              </div>
            </div>
          </Providers>
        </AuthProvider>
      </body>
    </html>
  );
}
