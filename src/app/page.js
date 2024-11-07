'use client';
import StyledTable from '@/comp/StyledTable';
import { format } from 'date-fns';
import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import * as XLSX from 'xlsx';
import { useCsvData } from '../../hooks';
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
  const { csvData } = useCsvData();
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const [currentModelNumber, setCurrentModelNumber] = useState(null);
  const { selectedModel, modelFields } = useModelStore();
  const socket = useSocket();

  const { session, status } = useProtectedRoute();
  console.log({ startDate, endDate });

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

    // Scanner trigger response handler
    const handleScannerTriggerResponse = (response) => {
      if (response.success) {
        toast.success(response.message);
      } else {
        toast.error(response.message);
      }
    };

    // Mark on response handler
    const handleMarkOnResponse = (response) => {
      if (response.success) {
        toast.success(response.message);
      } else {
        toast.error(response.message);
      }
    };

    // Add new socket event listeners
    const handleMarkingData = (data) => {
      setMarkingData(data);
    };

    const handleScannerData = (data) => {
      setScannerData(data);
    };

    // Register event listeners
    socket.on('scanner_trigger_response', handleScannerTriggerResponse);
    socket.on('mark_on_response', handleMarkOnResponse);
    socket.on('marking_data', handleMarkingData);
    socket.on('scanner_data', handleScannerData);

    // Cleanup listeners on unmount
    return () => {
      socket.off('scanner_trigger_response', handleScannerTriggerResponse);
      socket.off('mark_on_response', handleMarkOnResponse);
      socket.off('marking_data', handleMarkingData);
      socket.off('scanner_data', handleScannerData);
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
      const formattedData = data.map((row) => ({
        SerialNumber: row.SerialNumber,
        Timestamp: format(new Date(row.Timestamp), 'dd/MM/yyyy HH:mm:ss'), // Format date to dd/mm/yyyy hh:mm:ss
        MarkingData: row.MarkingData,
        ScannerData: row.ScannerData,
        Result: row.Result,
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
    <div className="h-[calc(100vh-4rem)] bg-gray-50 p-6">
      {status === 'loading' ? (
        <LoadingSpinner />
      ) : (
        <div className="h-full flex flex-col gap-4">
          {/* Enhanced Current Model Section */}
          {currentModelNumber && (
            <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white py-4 shadow-lg rounded-lg">
              <div className="container flex items-center justify-between px-6">
                <div className="flex items-center gap-3">
                  <span className="text-lg font-medium">Current Model:</span>
                  <code className="px-4 py-2 rounded-md bg-white/20 backdrop-blur-sm text-white font-mono text-lg font-bold">
                    {currentModelNumber}
                  </code>
                </div>
                <div className="text-sm bg-blue-900/30 px-3 py-1 rounded-full">
                  Last Updated: {new Date().toLocaleTimeString()}
                </div>
              </div>
            </div>
          )}

          {/* Manual Mode and Report Download Row */}
          <div className="grid grid-cols-2 gap-6">
            {/* Enhanced Manual Mode Section */}
            <div className="bg-white p-6 rounded-xl shadow-lg border-t-4 border-indigo-600">
              <h2 className="text-xl font-bold mb-4 text-gray-800 border-b pb-2">
                Manual Mode Controls
              </h2>
              <div className="flex items-center gap-4">
                <Button
                  variant="default"
                  onClick={handleScannerTrigger}
                  className="bg-emerald-600 hover:bg-emerald-700 transition-all duration-200 shadow-md hover:shadow-lg px-6 py-2 text-base"
                >
                  Scanner Trigger
                </Button>
                <Button
                  variant="default"
                  onClick={handleMarkOn}
                  className="bg-rose-600 hover:bg-rose-700 transition-all duration-200 shadow-md hover:shadow-lg px-6 py-2 text-base"
                >
                  Mark On
                </Button>
                <Button
                  variant="default"
                  onClick={handleLigt}
                  className="bg-amber-500 hover:bg-amber-600 transition-all duration-200 shadow-md hover:shadow-lg px-6 py-2 text-base"
                >
                  LIGT
                </Button>
              </div>
            </div>

            {/* Enhanced Report Download Section */}
            <div className="bg-white p-6 rounded-xl shadow-lg border-t-4 border-purple-600">
              <h2 className="text-xl font-bold mb-4 text-gray-800 border-b pb-2">
                Report Download
              </h2>
              <div className="flex items-center gap-4">
                <DatePicker
                  selected={startDate}
                  onSelect={setStartDate}
                  placeholder="Start Date"
                  className="border-2 focus:border-purple-500"
                />
                <DatePicker
                  selected={endDate}
                  onSelect={setEndDate}
                  placeholder="End Date"
                  className="border-2 focus:border-purple-500"
                />
                <Button
                  variant="secondary"
                  className="bg-purple-600 hover:bg-purple-700 transition-all duration-200 shadow-md hover:shadow-lg text-white px-6 py-2 text-base"
                  onClick={handleDownloadExcel}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    'Download CSV Report'
                  )}
                </Button>
              </div>
            </div>
          </div>

          {/* Enhanced Real-time Data Section */}
          <div className="grid grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-xl shadow-lg border-l-4 border-cyan-600">
              <h3 className="text-lg font-bold mb-3 text-gray-800">Marking Data</h3>
              <div className="p-4 bg-gray-50 rounded-lg border border-gray-200 min-h-[50px] font-mono text-gray-700">
                {markingData || 'Waiting for data...'}
              </div>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-lg border-l-4 border-teal-600">
              <h3 className="text-lg font-bold mb-3 text-gray-800">Scanner Data</h3>
              <div className="p-4 bg-gray-50 rounded-lg border border-gray-200 min-h-[50px] font-mono text-gray-700">
                {scannerData || 'Waiting for data...'}
              </div>
            </div>
          </div>

          {/* Enhanced Table Section */}
          <div className="flex-1 bg-white rounded-xl shadow-lg border-b-4 border-gray-200 overflow-hidden">
            <div className="p-4 bg-gradient-to-r from-gray-50 to-gray-100 border-b">
              <h3 className="text-lg font-bold text-gray-800">Data Table</h3>
            </div>
            <StyledTable data={csvData?.data} highlightNGRows />
          </div>
        </div>
      )}
    </div>
  );
}

export default Page;
