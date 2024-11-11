'use client';
import StyledTable2 from '@/comp/StyledTable2';
import { format } from 'date-fns';
import { useState, useEffect, useRef } from 'react';
import { toast } from 'react-toastify';
import * as XLSX from 'xlsx';
import { useCsvData } from '../../hooks/useSocket';
import React from 'react';
import { Button } from '@/components/ui/button';
import { DatePicker } from '@/components/ui/date-picker';
import { useRouter } from 'next/navigation';
import { useProtectedRoute } from '../../hooks/useProtectedRoute';
import { Loader2 } from 'lucide-react';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import useModelStore from '@/store/modelStore';
import { useSocket } from '@/SocketContext';

function Page() {
  const { csvData, loading: isTableLoading } = useCsvData();
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const [currentModelNumber, setCurrentModelNumber] = useState(null);
  const { selectedModel, modelFields } = useModelStore();
  const socket = useSocket();

  const { session, status } = useProtectedRoute();
  console.log({ startDate, endDate });

  // Move useRef declarations to component level
  const markingTimeoutRef = useRef(null);
  const scannerTimeoutRef = useRef(null);

  const [markingData, setMarkingData] = useState('');
  const [scannerData, setScannerData] = useState('');

  useEffect(() => {
    const fetchCurrentModel = async () => {
      try {
        const response = await fetch('/api/part-number/get-current');
        if (!response.ok) throw new Error('Failed to fetch current model configuration');
        const data = await response.json();

        setCurrentModelNumber(data.currentModelNumber || 'No Model Selected');
      } catch (error) {
        console.error('Error fetching current model:', error);
        toast.error('Failed to fetch current model configuration');
      }
    };

    fetchCurrentModel();
  }, []);

  useEffect(() => {
    if (!socket) return;

    const handleMarkingData = (data) => {
      if (markingTimeoutRef.current) {
        clearTimeout(markingTimeoutRef.current);
      }

      setMarkingData(data.data);

      // Clear data after 300ms
      markingTimeoutRef.current = setTimeout(() => {
        setMarkingData('');
      }, 10 * 1000);
    };

    const handleScannerData = (data) => {
      if (scannerTimeoutRef.current) {
        clearTimeout(scannerTimeoutRef.current);
      }

      setScannerData(data.data);

      // Clear data after 300ms
      scannerTimeoutRef.current = setTimeout(() => {
        setScannerData('');
      }, 5 * 1000);
    };

    socket.on('marking_data', handleMarkingData);
    socket.on('scanner_read', handleScannerData);

    // Cleanup function
    return () => {
      // Clear socket listeners
      socket.off('marking_data', handleMarkingData);
      socket.off('scanner_read', handleScannerData);

      // Clear any pending timeouts
      if (markingTimeoutRef.current) {
        clearTimeout(markingTimeoutRef.current);
      }
      if (scannerTimeoutRef.current) {
        clearTimeout(scannerTimeoutRef.current);
      }
    };
  }, [socket]);

  const handleDownloadExcel = async () => {
    console.log('Downloading Excel with date range:', startDate, endDate);

    if (!startDate || !endDate) {
      toast.error('Please select both start and end dates');
      return;
    }

    setIsLoading(true); // Optional: manage loading state
    try {
      // Fetch data from the server
      const response = await fetch('/api/reports', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch report data');
      }

      const data = await response.json();

      if (data.length === 0) {
        toast.error('No data found for the specified date range.');
        return;
      }

      // Format the data as per the requirements
      const formattedData = data.map((row, index) => ({
        SerialNumber: index + 1, // Auto-increment starting from 1
        Timestamp: format(new Date(row.Timestamp), 'dd/MM/yyyy HH:mm:ss'),
        MarkingData: row.MarkingData,
        ScannerData: row.ScannerData,
        Result: row.Result,
        User: row.User,
      }));

      // Create a worksheet from the formatted data
      const worksheet = XLSX.utils.json_to_sheet(formattedData);

      // Calculate and set column widths based on the content of each column
      const columnWidths = Object.keys(formattedData[0]).map((key) => ({
        wch: Math.max(
          key.length, // Column header width
          ...formattedData.map((row) => (row[key] ? row[key].toString().length : 10)), // Content width
        ),
      }));
      worksheet['!cols'] = columnWidths;

      // Create a new workbook and append the worksheet
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Report');

      // Write the workbook to a binary string
      const excelBuffer = XLSX.write(workbook, {
        bookType: 'xlsx',
        type: 'array',
      });

      // Create a Blob from the Excel binary and trigger download
      const blob = new Blob([excelBuffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `report_${format(startDate, 'yyyy-MM-dd')}_to_${format(
        endDate,
        'yyyy-MM-dd',
      )}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);

      toast.success('Report generated successfully!');
    } catch (error) {
      toast.error('Error generating report: ' + error.message);
    } finally {
      setIsLoading(false); // Optional: manage loading state
    }
  };

  const handleScannerTrigger = () => {
    if (!socket.connected) {
      toast.error('Socket not connected');
      return;
    }
    socket.emit('scanner_trigger');
  };

  const handleMarkOn = () => {
    if (!socket.connected) {
      toast.error('Socket not connected');
      return;
    }
    socket.emit('mark_on');
  };
  const handleLigt = () => {
    if (!socket.connected) {
      toast.error('Socket not connected');
      return;
    }
    socket.emit('light_on');
  };

  // console.log({ csvData });
  return (
    <div className="h-screen w-full p-4 flex flex-col gap-4 bg-slate-50">
      {/* Top Cards - Modern design */}
      <div className="grid grid-cols-2 gap-4">
        <div className="p-4 rounded-xl bg-[#012B41] text-white shadow-sm">
          <p className="text-sm text-gray-300 mb-1">Current Model</p>
          <h3 className="text-xl font-semibold truncate">{currentModelNumber || 'N/A'}</h3>
        </div>
        <div className="p-4 rounded-xl bg-[#012B41] text-white shadow-sm">
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <p className="text-sm text-gray-300 mb-1">Start Date</p>
              <DatePicker
                selected={startDate}
                onSelect={setStartDate}
                placeholder="Start Date"
                className="w-full h-9 text-sm px-3 rounded-lg bg-white/10 border-0 text-white placeholder:text-gray-400"
              />
            </div>
            <div className="flex-1">
              <p className="text-sm text-gray-300 mb-1">End Date</p>
              <DatePicker
                selected={endDate}
                onSelect={setEndDate}
                placeholder="End Date"
                className="w-full h-9 text-sm px-3 rounded-lg bg-white/10 border-0 text-white placeholder:text-gray-400"
              />
            </div>
            <div className="flex-1">
              <p className="text-sm text-gray-300 mb-1">Export</p>
              <Button
                size="default"
                className="w-full bg-blue-500 hover:bg-blue-600 text-sm h-9 rounded-lg"
                onClick={handleDownloadExcel}
                disabled={isLoading || !startDate || !endDate}
              >
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Download'}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Data Display & Controls Row */}
      <div className="grid grid-cols-12 gap-4">
        {/* Marking Data */}
        <div className="col-span-5 p-3 rounded-xl bg-white shadow-sm">
          <p className="text-xs font-medium text-gray-600 mb-1">Marking Data</p>
          <div
            className={`h-8 rounded-lg flex items-center px-3 transition-all duration-300
            ${markingData ? 'bg-blue-50 border border-blue-200' : 'bg-gray-50 border border-gray-200'}`}
          >
            <span
              className={`text-sm font-medium ${markingData ? 'text-blue-700' : 'text-gray-500'}`}
            >
              {markingData || 'Waiting for data...'}
            </span>
          </div>
        </div>

        {/* Scanner Data */}
        <div className="col-span-5 p-3 rounded-xl bg-white shadow-sm">
          <p className="text-xs font-medium text-gray-600 mb-1">Scanner Data</p>
          <div
            className={`h-8 rounded-lg flex items-center px-3 transition-all duration-300
            ${scannerData ? 'bg-blue-50 border border-blue-200' : 'bg-gray-50 border border-gray-200'}`}
          >
            <span
              className={`text-sm font-medium ${scannerData ? 'text-blue-700' : 'text-gray-500'}`}
            >
              {scannerData || 'Waiting for data...'}
            </span>
          </div>
        </div>

        {/* Control Buttons - Fixed layout */}
        <div className="col-span-2 p-3 rounded-xl bg-white shadow-sm">
          <p className="text-xs font-medium text-gray-600 mb-1">Manual Controls</p>
          <div className="flex gap-1.5">
            <Button
              className="flex-1 bg-[#012B41] hover:bg-[#023855] text-[11px] font-medium h-8 rounded-lg shadow-sm px-1"
              onClick={handleScannerTrigger}
            >
              Scanner
            </Button>
            <Button
              className="flex-1 bg-[#012B41] hover:bg-[#023855] text-[11px] font-medium h-8 rounded-lg shadow-sm px-1"
              onClick={handleMarkOn}
            >
              Mark
            </Button>
            <Button
              className="flex-1 bg-[#012B41] hover:bg-[#023855] text-[11px] font-medium h-8 rounded-lg shadow-sm px-1"
              onClick={handleLigt}
            >
              Light
            </Button>
          </div>
        </div>
      </div>

      {/* Table section remains unchanged */}
      <div className="flex-grow rounded-xl bg-white shadow-sm">
        <div className="p-2.5 border-b border-gray-200/60 bg-white/60">
          <h2 className="text-sm font-semibold text-gray-800">Production History</h2>
        </div>
        <div className="flex-grow p-2 min-h-0">
          {isTableLoading ? (
            <div className="h-full flex items-center justify-center">
              <LoadingSpinner />
            </div>
          ) : (
            <div className="h-full bg-white/80 rounded-lg border border-gray-200/60 shadow-sm">
              <StyledTable2 data={csvData?.data || []} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Page;
