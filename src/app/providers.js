"use client";

import { SessionProvider } from "next-auth/react";
import { SocketProvider } from "@/SocketContext";
import { ToastProvider } from "@/comp/ToastProvider";

export function Providers({ children }) {
  return (
    <SocketProvider>
      <ToastProvider>
        {/* <SessionProvider> */}
        {children}
        {/* </SessionProvider> */}
      </ToastProvider>
    </SocketProvider>
  );
}
