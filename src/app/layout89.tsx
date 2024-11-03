// app/layout.js or app/layout.tsx
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import AuthProvider from './context/authprovider';

import { ErrorToastHandler } from '@/comp/ErrorToasthandler';
import Sidebar from '../components/Sidebar';
import TopBar from '../components/TopBar';
import './globals.css';
import { Providers } from './providers';
import React from 'react';
import TestSidebar from './test-sidebar/page.js';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Laser-Solution',
  description: 'Laser Solutions',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    // <html lang="en">
    //   <body className={inter.className}>
    //     <AuthProvider>{children}</AuthProvider>
    //   </body>
    // </html>
    <html lang="en">
      <body className={inter.className}>
        <AuthProvider>
          <Providers>
            <ErrorToastHandler />
            <div className="flex">
              {/* Sidebar with a fixed width */}
              {/* <Sidebar /> */}
              <TestSidebar />
              {/* Main content area */}
            </div>
            <div className="flex-1 flex flex-col ml-64 bg-[#F3F4F6]">
              <TopBar />
              <main className="p-6 min-h-screen">{children}</main>
            </div>
          </Providers>
        </AuthProvider>
      </body>
    </html>
  );
}
