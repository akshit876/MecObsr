"use client";

import { ErrorToastHandler } from "@/comp/ErrorToasthandler";
import ModbusUI from "@/comp/ModbusPLC";
import { ToastProvider } from "@/comp/ToastProvider";

export default function ModbusPage() {
  return (
    <ToastProvider>
      {/* <ErrorToastHandler /> */}
      <div className="px-[5px]">
        <h1 className="text-3xl font-bold mb-6">PLC Control Panel</h1>
        <ModbusUI />
      </div>
    </ToastProvider>
  );
}
