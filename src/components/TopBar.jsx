"use client";
import { useState } from "react";
import { FaSearch, FaUserCircle } from "react-icons/fa";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { IoSettingsOutline } from "react-icons/io5";
import { FiLogOut } from "react-icons/fi";
import { CgProfile } from "react-icons/cg";

const TopBar = () => {
  const { data: session } = useSession();
  const router = useRouter();
  console.log({ session });

  const handleLogout = async () => {
    try {
      await signOut();
      router.push("/login");
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  return (
    <div className="sticky top-0 z-50 flex items-center justify-between bg-white/80 backdrop-blur-sm h-16 px-6 shadow-sm border-b border-gray-200">
      {/* Left side - Search */}
      <div className="flex items-center gap-4">
        <div className="relative flex items-center">
          <FaSearch className="absolute left-3 text-gray-400 h-4 w-4" />
          <input
            type="text"
            placeholder="Search..."
            className="pl-10 pr-4 py-2 w-[300px] bg-gray-50/50 rounded-lg 
                     border border-gray-200 outline-none focus:border-blue-500 
                     focus:ring-2 focus:ring-blue-100 transition-all"
          />
        </div>
      </div>

      {/* Right side - Profile dropdown */}
      <div className="flex items-center gap-4">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="relative p-0 h-8 w-8 hover:bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0"
            >
              <FaUserCircle className="h-8 w-8 text-gray-400 hover:text-gray-600" />
            </Button>
          </DropdownMenuTrigger>

          <DropdownMenuContent
            className="w-64 mt-2 p-2 bg-white/95 backdrop-blur-sm border border-gray-200 shadow-lg"
            align="end"
          >
            {/* User Info Section */}
            <DropdownMenuLabel className="p-3 bg-gray-50/50 rounded-md">
              <div className="flex flex-col space-y-2">
                <p className="text-sm font-semibold text-gray-900">
                  {session?.user?.name || "User"}
                </p>
                <p className="text-xs text-gray-500 truncate">
                  {session?.user?.email}
                </p>
                <span className="inline-flex items-center rounded-md bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 mt-1 w-fit">
                  {session?.user?.role || "user"}
                </span>
              </div>
            </DropdownMenuLabel>

            <DropdownMenuSeparator className="my-1 bg-gray-200" />

            {/* Menu Items */}
            <DropdownMenuItem
              className="p-3 cursor-pointer hover:bg-gray-50 rounded-md flex items-center gap-3 text-gray-700"
              onClick={() => router.push("/profile")}
            >
              <CgProfile className="h-4 w-4" />
              <span>Profile</span>
            </DropdownMenuItem>

            <DropdownMenuItem
              className="p-3 cursor-pointer hover:bg-gray-50 rounded-md flex items-center gap-3 text-gray-700"
              onClick={() => router.push("/settings")}
            >
              <IoSettingsOutline className="h-4 w-4" />
              <span>Settings</span>
            </DropdownMenuItem>

            <DropdownMenuSeparator className="my-1 bg-gray-200" />

            <DropdownMenuItem
              className="p-3 cursor-pointer hover:bg-red-50 text-red-600 rounded-md flex items-center gap-3"
              onClick={handleLogout}
            >
              <FiLogOut className="h-4 w-4" />
              <span>Logout</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
};

export default TopBar;
