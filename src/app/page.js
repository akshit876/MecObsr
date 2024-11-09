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
    <div className="w-full min-h-screen p-2">
      <div className="w-full space-y-2">
        <div
          className="rounded-lg border border-gray-200/60 
          bg-gradient-to-r from-[#0a2942]/95 to-[#0a2942]/90
          backdrop-blur-lg shadow-[0_8px_30px_rgb(0,0,0,0.12)] 
          hover:shadow-[0_8px_30px_rgb(0,0,0,0.15)] 
          transition-all duration-300"
        >
          <div className="p-3">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h1 className="text-lg font-bold text-white/90 mb-0.5">Production Monitoring</h1>
                <p className="text-sm text-gray-300/80">Real-time tracking and analysis</p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div
                className="bg-white/10 backdrop-blur-md p-3 rounded-lg border border-white/10 
                hover:border-blue-500/30 transition-all duration-300 shadow-lg"
              >
                <p className="text-xs text-gray-300/80 mb-1">Total Production</p>
                <h3 className="text-2xl font-bold text-white">{csvData?.data?.length || 0}</h3>
              </div>
              <div
                className="bg-white/10 backdrop-blur-md p-3 rounded-lg border border-white/10 
                hover:border-blue-500/30 transition-all duration-300 shadow-lg"
              >
                <p className="text-xs text-gray-300/80 mb-1">Success Rate</p>
                <h3 className="text-2xl font-bold text-white">98.5%</h3>
              </div>
              <div
                className="bg-white/10 backdrop-blur-md p-3 rounded-lg border border-white/10 
                hover:border-blue-500/30 transition-all duration-300 shadow-lg"
              >
                <p className="text-xs text-gray-300/80 mb-1">Current Model</p>
                <h3 className="text-2xl font-bold text-white truncate">
                  {currentModelNumber || 'N/A'}
                </h3>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-12 gap-3">
          <div
            className="col-span-2 rounded-lg p-2.5 border border-gray-200/60 
            bg-white/30 backdrop-blur-lg shadow-[0_8px_30px_rgb(0,0,0,0.05)] 
            hover:shadow-[0_8px_30px_rgb(0,0,0,0.1)] 
            hover:border-blue-500/50 transition-all duration-300"
          >
            <h2 className="text-sm font-bold mb-2 text-gray-800 uppercase tracking-wide">
              Manual Controls
            </h2>
            <div className="flex flex-col h-[calc(100%-2rem)] gap-1.5">
              <Button
                size="xs"
                className="flex-1 bg-blue-500/90 hover:bg-blue-600 text-xs flex items-center justify-center
                  shadow-lg hover:shadow-blue-500/20 transition-all duration-300"
                onClick={handleScannerTrigger}
              >
                Scanner Trigger
              </Button>
              <Button
                size="xs"
                className="flex-1 bg-blue-500/90 hover:bg-blue-600 text-xs flex items-center justify-center
                  shadow-lg hover:shadow-blue-500/20 transition-all duration-300"
                onClick={handleMarkOn}
              >
                Mark On
              </Button>
              <Button
                size="xs"
                className="flex-1 bg-blue-500/90 hover:bg-blue-600 text-xs flex items-center justify-center
                  shadow-lg hover:shadow-blue-500/20 transition-all duration-300"
                onClick={handleLigt}
              >
                Light Control
              </Button>
            </div>
          </div>

          <div
            className="col-span-6 rounded-lg p-2.5 border border-gray-200/60 
            bg-white/30 backdrop-blur-lg shadow-[0_8px_30px_rgb(0,0,0,0.05)]
            hover:shadow-[0_8px_30px_rgb(0,0,0,0.1)] 
            hover:border-blue-500/50 transition-all duration-300"
          >
            <h2 className="text-sm font-bold mb-4 text-gray-800 uppercase tracking-wide">
              Current Data
            </h2>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-bold text-gray-700 mb-2 block">Marking Data</label>
                <div
                  className={`p-4 rounded-lg border-2 transition-all duration-300 text-center
                  ${
                    markingData
                      ? 'bg-blue-50 border-blue-500 shadow-lg shadow-blue-500/20'
                      : 'bg-white/50 border-gray-200/60'
                  }`}
                >
                  <span
                    className={`text-xl font-bold ${markingData ? 'text-blue-700' : 'text-gray-500'}`}
                  >
                    {markingData || 'Waiting for data...'}
                  </span>
                </div>
              </div>
              <div>
                <label className="text-sm font-bold text-gray-700 mb-2 block">Scanner Data</label>
                <div
                  className={`p-4 rounded-lg border-2 transition-all duration-300 text-center
                  ${
                    scannerData
                      ? 'bg-green-50 border-green-500 shadow-lg shadow-green-500/20'
                      : 'bg-white/50 border-gray-200/60'
                  }`}
                >
                  <span
                    className={`text-xl font-bold ${scannerData ? 'text-green-700' : 'text-gray-500'}`}
                  >
                    {scannerData || 'Waiting for data...'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div
            className="col-span-4 rounded-lg p-2.5 border border-gray-200/60 
            bg-white/30 backdrop-blur-lg shadow-[0_8px_30px_rgb(0,0,0,0.05)] 
            hover:shadow-[0_8px_30px_rgb(0,0,0,0.1)] 
            hover:border-blue-500/50 transition-all duration-300"
          >
            <h2 className="text-sm font-bold mb-1.5 text-gray-700 uppercase tracking-wide">
              Generate Report
            </h2>
            <div className="flex flex-col h-[calc(100%-2rem)] justify-between">
              <div className="space-y-1">
                <DatePicker
                  selected={startDate}
                  onSelect={setStartDate}
                  placeholder="Start Date"
                  className="w-full h-7 text-xs px-2 border-gray-200 focus:border-blue-500"
                />
                <DatePicker
                  selected={endDate}
                  onSelect={setEndDate}
                  placeholder="End Date"
                  className="w-full h-7 text-xs px-2 border-gray-200 focus:border-blue-500"
                />
              </div>
              <Button
                size="sm"
                className="w-full bg-blue-500 hover:bg-blue-600 text-xs font-medium"
                onClick={handleDownloadExcel}
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                    Generating...
                  </>
                ) : (
                  'Download Report'
                )}
              </Button>
            </div>
          </div>
        </div>

        <div
          className="rounded-lg border border-gray-200/60 
          bg-white/30 backdrop-blur-lg shadow-[0_8px_30px_rgb(0,0,0,0.05)]
          hover:shadow-[0_8px_30px_rgb(0,0,0,0.1)] 
          transition-all duration-300"
        >
          <div className="p-4 border-b border-gray-200/60 bg-white/50 backdrop-blur-md rounded-t-lg">
            <h2 className="text-lg font-bold text-gray-800 uppercase tracking-wide">
              Production History
            </h2>
            <p className="text-sm text-gray-500/80">Real-time production monitoring data</p>
          </div>

          <div className="p-4 bg-white/40 backdrop-blur-sm rounded-b-lg">
            {isTableLoading ? (
              <div className="h-[700px] flex items-center justify-center">
                <LoadingSpinner />
              </div>
            ) : (
              <div className="h-[700px] bg-white/70 rounded-lg border border-gray-200/60 shadow-inner">
                <StyledTable2 data={csvData?.data || []} />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Page;
