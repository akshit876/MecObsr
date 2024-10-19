"use client";
import StyledTable from "@/comp/StyledTable";
import React, { useState } from "react";
import { useCsvData } from "../../hooks";
import { format } from "date-fns";
import { toast, ToastContainer } from "react-toastify";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@radix-ui/react-popover";

import { cn } from "@/lib/utils";
import { Calendar, CalendarIcon } from "lucide-react";
import { DatePicker } from "@/components/ui/date-picker";
import { Button } from "@/components/ui/button";
// import { useProtectedRoute } from "../../hooks/useProtectedRoute";

function AdminPanel() {
  const { csvData, loading } = useCsvData();
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleDownloadCSV = async () => {
    // Implement CSV download logic here
    console.log("Downloading CSV with date range:", startDate, endDate);
    if (!startDate || !endDate) {
      toast.error("Please select both start and end dates");
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch("/api/reports", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to generate report");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.style.display = "none";
      a.href = url;
      a.download = `report_${format(startDate, "yyyy-MM-dd")}_to_${format(endDate, "yyyy-MM-dd")}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      toast.error("Error generating report: " + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  // console.log({ csvData });
  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="mb-6 flex items-center space-x-4">
        <DatePicker
          selected={startDate}
          onSelect={setStartDate}
          placeholder="Start Date"
        />
        <DatePicker
          selected={endDate}
          onSelect={setEndDate}
          placeholder="End Date"
        />
        <Button onClick={handleDownloadCSV}>Download CSV Report</Button>
      </div>
      <StyledTable data={csvData?.data} />
    </div>
  );
}

export default AdminPanel;
