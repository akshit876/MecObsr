// components/Sidebar.js
"use client";
import {
  FaHome,
  FaChartBar,
  FaCogs,
  FaBell,
  FaTable,
  FaCalendar,
} from "react-icons/fa";
import Link from "next/link";
import { useState } from "react";
import { useProtectedRoute } from "../../hooks/useProtectedRoute";

const Sidebar = () => {
  const [active, setActive] = useState("Dashboard");
  const { session } = useProtectedRoute();
  const menuItems = [
    { name: "Dashboard", icon: <FaHome />, href: "/" },
    ...(session?.user?.role === "admin"
      ? [{ name: "Settings", icon: <FaCogs />, href: "/settings" }]
      : []), // Conditionally add the settings link if the user is an admin
    // Add more routes as needed
  ];
  const menuItems2 = [
    { name: "Dashboard", icon: <FaHome />, href: "/" },
    { name: "Settings", icon: <FaChartBar />, href: "/settings" },
    // { name: "PLC", icon: <FaCogs />, href: "/plc" },
    // { name: "Reports", icon: <FaTable />, href: "/reports" },
    // { name: "Advanced", icon: <FaBell />, href: "/advanced-ui" },
    // { name: "Marking Data", icon: <FaBell />, href: "/marking-data" },
    // { name: "Shift Settings", icon: <FaBell />, href: "/shift-settings" },
    // { name: "Manual Mode", icon: <FaBell />, href: "/manual-mode" },
    // { name: "Calendar", icon: <FaCalendar />, href: "/calendar" },
    // { name: "Settings", icon: <FaCogs />, href: "/settings" },
  ];

  return (
    <div className="flex flex-col h-full w-64 bg-[#1E1E2D] text-white p-4 overflow-hidden fixed">
      <div className="flex items-center justify-center mb-8">
        <h1 className="text-2xl font-semibold">RICO</h1>
      </div>
      <nav className="flex flex-col gap-2">
        {menuItems.map((item) => (
          <Link
            key={item.name}
            href={item.href}
            className={`flex items-center gap-3 p-2 rounded-md transition-all ${
              active === item.name
                ? "bg-[#4B49AC] text-white"
                : "text-[#7DA0FA] hover:bg-[#2D2F3A]"
            }`}
            onClick={() => setActive(item.name)}
          >
            <div className="text-lg">{item.icon}</div>
            <span className="font-medium">{item.name}</span>
          </Link>
        ))}
      </nav>
    </div>
  );
};

export default Sidebar;
