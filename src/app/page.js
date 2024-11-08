'use client';
import StyledTable2 from '@/comp/StyledTable2';
import { format } from 'date-fns';
import { useState, useEffect } from 'react';
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
    <div className="w-full min-h-screen p-6">
      <div className="w-full bg-white rounded-lg shadow">
        {/* Header Stats */}
        <div className="bg-[#0a2942] text-white rounded-lg p-4 mb-6">
          <h1 className="text-xl font-semibold mb-1">Production Monitoring</h1>
          <p className="text-sm text-gray-400 mb-4">Real-time tracking and analysis</p>

          <div className="grid grid-cols-3 gap-4">
            <div className="bg-[#1a3b55] p-4 rounded-lg">
              <p className="text-sm text-gray-400">Total Production</p>
              <h3 className="text-2xl font-bold">{csvData?.data?.length || 0}</h3>
            </div>
            <div className="bg-[#1a3b55] p-4 rounded-lg">
              <p className="text-sm text-gray-400">Success Rate</p>
              <h3 className="text-2xl font-bold">98.5%</h3>
            </div>
            <div className="bg-[#1a3b55] p-4 rounded-lg">
              <p className="text-sm text-gray-400">Current Model</p>
              <h3 className="text-2xl font-bold">{currentModelNumber || 'N/A'}</h3>
            </div>
          </div>
        </div>

        {/* Control Panels */}
        <div className="grid grid-cols-3 gap-6 mb-6">
          {/* Manual Controls */}
          <div className="bg-white rounded-lg shadow-sm p-4">
            <h2 className="text-sm font-semibold mb-3">Manual Controls</h2>
            <div className="space-y-2">
              <Button
                className="w-full bg-blue-500 hover:bg-blue-600"
                onClick={handleScannerTrigger}
              >
                Scanner Trigger
              </Button>
              <Button className="w-full bg-blue-500 hover:bg-blue-600" onClick={handleMarkOn}>
                Mark On
              </Button>
              <Button className="w-full bg-blue-500 hover:bg-blue-600" onClick={handleLigt}>
                Light Control
              </Button>
            </div>
          </div>

          {/* Current Data */}
          <div className="bg-white rounded-lg shadow-sm p-4">
            <h2 className="text-sm font-semibold mb-3">Current Data</h2>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-gray-500">Marking Data</label>
                <div className="mt-1 p-2 bg-gray-50 rounded border text-sm">
                  {markingData || 'Waiting for data...'}
                </div>
              </div>
              <div>
                <label className="text-xs text-gray-500">Scanner Data</label>
                <div className="mt-1 p-2 bg-gray-50 rounded border text-sm">
                  {scannerData || 'Waiting for data...'}
                </div>
              </div>
            </div>
          </div>

          {/* Report Generation */}
          <div className="bg-white rounded-lg shadow-sm p-4">
            <h2 className="text-sm font-semibold mb-3">Generate Report</h2>
            <div className="space-y-3">
              <DatePicker
                selected={startDate}
                onSelect={setStartDate}
                placeholder="Start Date"
                className="w-full"
              />
              <DatePicker
                selected={endDate}
                onSelect={setEndDate}
                placeholder="End Date"
                className="w-full"
              />
              <Button
                className="w-full bg-blue-500 hover:bg-blue-600"
                onClick={handleDownloadExcel}
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  'Download Report'
                )}
              </Button>
            </div>
          </div>
        </div>

        {/* Table Section */}
        <div className="bg-white rounded-lg shadow-sm">
          <div className="p-4 border-b">
            <h2 className="text-lg font-semibold">Production History</h2>
            <p className="text-sm text-gray-500">Real-time production monitoring data</p>
          </div>
          <div className="p-4">
            {isTableLoading ? (
              <div className="h-[600px] flex items-center justify-center">
                <LoadingSpinner />
              </div>
            ) : (
              <div className="h-[600px]">
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
