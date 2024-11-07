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
    <div className="h-[calc(100vh-4rem)] bg-gray-100 p-6">
      {status === 'loading' ? (
        <LoadingSpinner />
      ) : (
        <div className="h-full flex flex-col">
          {currentModelNumber && (
            <>
              <div className="bg-blue-600 text-white py-3 shadow-lg rounded-lg">
                <div className="container flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-medium">Current Model:</span>
                    <code className="px-3 py-1 rounded-md bg-blue-700 text-white font-mono text-lg font-bold">
                      {currentModelNumber}
                    </code>
                  </div>
                  <div className="text-sm">Last Updated: {new Date().toLocaleTimeString()}</div>
                </div>
              </div>

              {/* <div className="flex items-center gap-4 mt-4">
                <Button
                  variant="default"
                  onClick={handleScannerTrigger}
                  className="bg-green-600 hover:bg-green-700"
                >
                  Scanner Trigger
                </Button>
                <Button
                  variant="default"
                  onClick={handleMarkOn}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  Mark On
                </Button>
              </div> */}
            </>
          )}

          <div className="flex items-center gap-4 px-0 py-4">
            <DatePicker selected={startDate} onSelect={setStartDate} placeholder="Start Date" />
            <DatePicker selected={endDate} onSelect={setEndDate} placeholder="End Date" />
            <Button
              variant="secondary"
              style={{ color: 'white' }}
              className="[&]:!text-white [&>*]:!text-white [&]:hover:!text-white"
              onClick={handleDownloadExcel}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin text-white" />
                  Generating...
                </>
              ) : (
                'Download CSV Report'
              )}
            </Button>
            <Button
              variant="default"
              onClick={handleScannerTrigger}
              className="bg-green-600 hover:bg-green-700"
            >
              Scanner Trigger
            </Button>
            <Button
              variant="default"
              onClick={handleMarkOn}
              className="bg-red-600 hover:bg-red-700"
            >
              Mark On
            </Button>
            <Button
              variant="default"
              onClick={handleLigt}
              className="bg-yellow-600 hover:bg-yellow-700"
            >
              LIGHT
            </Button>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="bg-white p-4 rounded-lg shadow">
              <h3 className="text-lg font-semibold mb-2 text-gray-700">Marking Data</h3>
              <div className="p-3 bg-gray-100 rounded min-h-[50px] font-mono">
                {markingData || 'Waiting for data...'}
              </div>
            </div>
            <div className="bg-white p-4 rounded-lg shadow">
              <h3 className="text-lg font-semibold mb-2 text-gray-700">Scanner Data</h3>
              <div className="p-3 bg-gray-100 rounded min-h-[50px] font-mono">
                {scannerData || 'Waiting for data...'}
              </div>
            </div>
          </div>

          <div className="px-0 flex-1">
            <StyledTable data={csvData?.data} highlightNGRows />
          </div>
        </div>
      )}
    </div>
  );
}

export default Page;
