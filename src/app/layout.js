/* eslint-disable react/prop-types */
// app/layout.js or app/layout.tsx
import { Inter } from "next/font/google";
import { SessionProvider } from "next-auth/react";
import "./globals.css";
import Sidebar from "../components/Sidebar";
import TopBar from "../components/TopBar";
import { SocketProvider } from "@/SocketContext";
import { ToastProvider } from "@/comp/ToastProvider";
import { ErrorToastHandler } from "@/comp/ErrorToasthandler";
import { Providers } from "./providers";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "Dashboard",
  description: "Dark Themed Dashboard",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={inter.className}>
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
      </body>
    </html>
  );
}
