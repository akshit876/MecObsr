/* eslint-disable react/prop-types */
// app/layout.js or app/layout.tsx
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import AuthProvider from './context/authprovider';
import { SessionProvider } from 'next-auth/react';
import './globals.css';
import Sidebar from '../components/Sidebar';
import TopBar from '../components/TopBar';
import { SocketProvider } from '@/SocketContext';
import { ToastProvider } from '@/comp/ToastProvider';
import { ErrorToastHandler } from '@/comp/ErrorToasthandler';
import { Providers } from './providers';

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
              <Sidebar />

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
