/* eslint-disable react/prop-types */
import { ErrorToastHandler } from '@/comp/ErrorToasthandler';
import SidebarNav from './test-sidebar/page';
import React from 'react';
import { Providers } from './providers';
import AuthProvider from './context/authprovider';
import './globals.css';
import TopBar from '@/components/TopBar';

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          <Providers>
            <ErrorToastHandler />
            <div className="flex min-h-screen">
              <SidebarNav />
              <main className="flex-1">
                <TopBar />
                <section>{children}</section>
              </main>
            </div>
          </Providers>
        </AuthProvider>
      </body>
    </html>
  );
}
