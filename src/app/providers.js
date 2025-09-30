'use client';

import { SessionProvider } from 'next-auth/react';
import { SocketProvider } from '@/SocketContext';
import { SafetySocketProvider } from '@/SafetySocketContext';
import { ToastProvider } from '@/comp/ToastProvider';

export function Providers({ children }) {
  return (
    <SocketProvider>
      <SafetySocketProvider>
        <ToastProvider>
          {/* <SessionProvider> */}
          {children}
          {/* </SessionProvider> */}
        </ToastProvider>
      </SafetySocketProvider>
    </SocketProvider>
  );
}
