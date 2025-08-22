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
// import { useRouter } from 'next/navigation';
// import { useProtectedRoute } from '../../hooks/useProtectedRoute';
import { Loader2, Download } from 'lucide-react';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
// import useModelStore from '@/store/modelStore';
import { useSocket } from '@/SocketContext';
import { usePulseSignal } from '@/hooks/usePulseSignal';
import { useMachineEvents } from '@/hooks/useMachineEvents';

// Helper function to calculate piece number based on timestamp
const calculatePieceNumber = (timestamp, data) => {
  const recordDate = new Date(timestamp);
  const startOfDay = new Date(recordDate);
  startOfDay.setHours(6, 0, 0, 0); // Start counting from 6 AM

  // If the record is before 6 AM, consider it part of previous day
  if (recordDate.getHours() < 6) {
    startOfDay.setDate(startOfDay.getDate() - 1);
  }

  // Filter records from the same day (from 6 AM onwards)
  const sameDayRecords = data.filter((record) => {
    const recordTimestamp = new Date(record.Timestamp);
    const recordStartOfDay = new Date(recordTimestamp);
    recordStartOfDay.setHours(6, 0, 0, 0);

    if (recordTimestamp.getHours() < 6) {
      recordStartOfDay.setDate(recordStartOfDay.getDate() - 1);
    }

    return recordStartOfDay.getTime() === startOfDay.getTime() && recordTimestamp >= startOfDay;
  });

  // Sort by timestamp and find the position
  sameDayRecords.sort((a, b) => new Date(a.Timestamp) - new Date(b.Timestamp));
  const pieceIndex = sameDayRecords.findIndex((record) => record.Timestamp === timestamp);

  return pieceIndex + 1;
};

// Helper function to show toast and clear previous ones
const showToast = (type, message, options = {}) => {
  toast.dismiss(); // Clear all existing toasts
  toast[type](message, options);
};

function Page() {
  const {
    csvData,
    loading: isTableLoading,
    hasMore,
    totalRecords,
    loadMoreData,
    refreshData,
  } = useCsvData();
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  // const router = useRouter();
  const [currentModelNumber, setCurrentModelNumber] = useState(null);
  // const { selectedModel, modelFields } = useModelStore();
  const socket = useSocket();

  // const { status } = useProtectedRoute();
  console.log({ startDate, endDate });

  // Move useRef declarations to component level
  const markingTimeoutRef = useRef(null);
  const scannerTimeoutRef = useRef(null);
  const validationToastRef = useRef(null);

  const [markingData, setMarkingData] = useState('');
  const [scannerData, setScannerData] = useState('');
  const [isValidationToastActive, setIsValidationToastActive] = useState(false);

  useEffect(() => {
    const fetchCurrentModel = async () => {
      try {
        const response = await fetch('/api/part-number/get-current');
        if (!response.ok) throw new Error('Failed to fetch current model configuration');
        const data = await response.json();

        setCurrentModelNumber(data.currentModelNumber || 'No Model Selected');
      } catch (error) {
        console.error('Error fetching current model:', error);
        // Removed toast notification to reduce GUI messages
      }
    };

    fetchCurrentModel();
  }, []);

  // Add updateProductionRecords function
  const updateProductionRecords = () => {
    // This will trigger a refresh of the CSV data through the existing hook
    refreshData();
  };

  // Manual refresh capability - modify existing refreshData to emit socket event
  const handleManualRefresh = () => {
    if (!socket?.connected) {
      // Removed toast notification to reduce GUI messages
      return;
    }
    socket.emit('request-recent-records', { limit: 100 });
  };

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

    const handleFirstScanOk = (data) => {
      showToast('warning', '⚠️ PART ALREADY MARKED! ⚠️', {
        description: data.message,
        duration: 5000,
        style: {
          fontSize: '16px',
          fontWeight: 'bold',
          textAlign: 'center',
          backgroundColor: '#ff6b35',
          color: 'white',
          border: '3px solid #ff4500',
          borderRadius: '8px',
          boxShadow: '0 4px 12px rgba(255, 107, 53, 0.4)',
        },
        bodyStyle: {
          fontSize: '14px',
          fontWeight: '600',
        },
      });
    };

    // Initial data load
    const handleCsvData = (data) => {
      console.log('Received csv-data:', data);
      // Update the production records table
      updateProductionRecords();
    };

    // Automatic refresh on cycle completion
    const handleCycleCompleted = (event) => {
      // Refresh the UI with latest data
      console.log('Cycle completed at:', event.timestamp);
      // The csv-data event will follow automatically
      // Removed toast notification to reduce GUI messages
    };

    // Detailed cycle status
    const handleScanCycleCompleted = (event) => {
      // Update cycle status indicators
      console.log(`Cycle ${event.cycleNumber}: ${event.success ? 'SUCCESS' : 'FAILED'}`);
      console.log('Result:', event.result);

      // Removed OK/NG toast notifications to reduce UI messages
      // Only logging to console for debugging purposes
    };

    // Handle recent records response
    const handleRecentRecords = (data) => {
      console.log('Received recent records:', data);
      updateProductionRecords();
    };

    const handleValidationError = (data) => {
      console.log('Validation error received:', data);
      console.log('Data type:', typeof data);
      console.log('Data keys:', Object.keys(data || {}));
      console.log('Data.details:', data?.details);
      console.log('Full data object:', JSON.stringify(data, null, 2));

      const errorMessage =
        data?.details || data?.message || data?.error || 'Validation error occurred';

      // If no validation toast is currently active, create one
      if (!isValidationToastActive) {
        console.log('No validation toast active, creating persistent one...');

        // Dismiss any existing toasts to ensure clean display
        toast.dismiss();

        setIsValidationToastActive(true);

        // Store the toast ID for cleanup
        const toastId = toast.error(
          <div>
            <div style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '8px' }}>
              ❌ Validation Error ❌
            </div>
            <div
              style={{
                fontSize: '14px',
                fontWeight: '700',
                whiteSpace: 'pre-line',
                textAlign: 'left',
              }}
            >
              {errorMessage}
            </div>
          </div>,
          {
            position: 'top-right',
            autoClose: false, // Never auto-close - persist until manually closed
            hideProgressBar: true, // No progress bar since it never closes
            closeOnClick: true,
            pauseOnHover: true,
            draggable: true,
            progress: undefined,
            style: {
              backgroundColor: '#fef2f2',
              color: '#dc2626',
              border: '3px solid #fecaca',
              borderRadius: '8px',
              boxShadow: '0 4px 12px rgba(239, 68, 68, 0.2)',
              maxWidth: '500px',
            },
            onClose: () => {
              // Reset active state when toast is closed
              console.log('Validation toast closed, resetting active state');
              setIsValidationToastActive(false);
              validationToastRef.current = null;
            },
          },
        );

        // Store the toast ID in ref for cleanup
        validationToastRef.current = toastId;

        console.log('Persistent validation toast created with ID:', toastId);
      } else {
        console.log('Validation toast already active, keeping existing one - no new toast');
        // Don't create new toast - keep the existing one visible
        // The toast will persist until manually closed by user
      }
    };

    // Register all socket event handlers
    socket.on('marking_data', handleMarkingData);
    socket.on('scanner_read', handleScannerData);
    socket.on('first_scan_ok', handleFirstScanOk);
    socket.on('csv-data', handleCsvData);
    socket.on('cycle-completed', handleCycleCompleted);
    socket.on('scan-cycle-completed', handleScanCycleCompleted);
    socket.on('recent-records', handleRecentRecords);
    socket.on('validation_error', handleValidationError);

    // Cleanup function
    return () => {
      // Clear socket listeners
      socket.off('marking_data', handleMarkingData);
      socket.off('scanner_read', handleScannerData);
      socket.off('first_scan_ok', handleFirstScanOk);
      socket.off('csv-data', handleCsvData);
      socket.off('cycle-completed', handleCycleCompleted);
      socket.off('scan-cycle-completed', handleScanCycleCompleted);
      socket.off('recent-records', handleRecentRecords);
      socket.off('validation_error', handleValidationError);

      // Clear any pending timeouts
      if (markingTimeoutRef.current) {
        clearTimeout(markingTimeoutRef.current);
      }
      if (scannerTimeoutRef.current) {
        clearTimeout(scannerTimeoutRef.current);
      }

      // Clear any active validation toast
      if (validationToastRef.current) {
        toast.dismiss(validationToastRef.current);
        validationToastRef.current = null;
      }
    };
  }, [socket]);

  const handleDownloadExcel = async () => {
    console.log('Downloading Excel with date range:', startDate, endDate);

    if (!startDate || !endDate) {
      showToast('error', 'Please select both start and end dates');
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
        showToast('error', 'No data found for the specified date range.');
        return;
      }

      // Format the data as per the requirements with piece number calculation
      const formattedData = data.map((row) => ({
        'Piece #': calculatePieceNumber(row.Timestamp, data),
        Timestamp: format(new Date(row.Timestamp), 'dd/MM/yyyy HH:mm:ss'),
        MarkingData: row.MarkingData,
        ScannerData: row.ScannerData,
        ModelNumber: row.ModelNumber || 'N/A',
        Result: row.Result,
      }));

      // Create a worksheet from the formatted data
      const worksheet = XLSX.utils.json_to_sheet(formattedData);

      // Calculate column widths with additional 50px (approximately 7 characters)
      const columnWidths = Object.keys(formattedData[0]).map((key) => ({
        wch:
          Math.max(
            key.length,
            ...formattedData.map((row) => (row[key] ? row[key].toString().length : 10)),
          ) + 7, // Add approximately 50px worth of characters
      }));
      worksheet['!cols'] = columnWidths;

      // Freeze the header row
      worksheet['!freeze'] = { pos: { r: 1, c: 0 } };

      // Add conditional formatting for Result column
      const resultColumnIndex = Object.keys(formattedData[0]).findIndex((key) => key === 'Result');

      // Apply colors to all rows (excluding header)
      for (let i = 1; i <= formattedData.length; i++) {
        const cellRef = XLSX.utils.encode_cell({ r: i, c: resultColumnIndex });
        if (!worksheet[cellRef]) continue;

        const result = worksheet[cellRef].v;
        worksheet[cellRef].s = {
          fill: {
            fgColor: { rgb: result === 'OK' ? '90EE90' : result === 'NG' ? 'FFB6C1' : 'FFFFFF' },
          },
        };
      }

      // Create a new workbook and append the worksheet
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Report');

      // Write the workbook with style options
      const excelBuffer = XLSX.write(workbook, {
        bookType: 'xlsx',
        type: 'array',
        cellStyles: true,
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

      showToast('success', 'Report generated successfully!');
    } catch (error) {
      showToast('error', 'Error generating report: ' + error.message);
    } finally {
      setIsLoading(false); // Optional: manage loading state
    }
  };

  const handleScannerTrigger = () => {
    if (!socket.connected) {
      // Removed toast notification to reduce GUI messages
      return;
    }
    socket.emit('scanner_trigger');
  };

  const handleMarkOn = () => {
    if (!socket.connected) {
      // Removed toast notification to reduce GUI messages
      return;
    }
    socket.emit('mark_on');
  };
  const handleLigt = () => {
    if (!socket.connected) {
      // Removed toast notification to reduce GUI messages
      return;
    }
    socket.emit('light_on');
  };

  // Use the pulse signal hook
  usePulseSignal(socket);

  // Add this line to use the machine events hook
  useMachineEvents(socket);

  // Test function to verify toast is working
  const testToast = () => {
    console.log('Testing toast...');
    toast.error('Test validation error message', {
      position: 'top-right',
      autoClose: 5000,
    });
  };

  // console.log({ csvData });
  return (
    <div className="h-screen w-full p-3 flex flex-col gap-2 bg-slate-50">
      {/* Top Cards - Compact design */}
      <div className="grid grid-cols-12 gap-2">
        {/* Current Model */}
        <div className="col-span-2 p-2 rounded-lg bg-[#012B41] text-white shadow-sm">
          <div>
            <p className="text-xs text-gray-300 mb-1">Current Model</p>
            <h3 className="text-sm font-semibold truncate">{currentModelNumber || 'N/A'}</h3>
          </div>
        </div>

        {/* Date Selection */}
        <div className="col-span-10 p-2 rounded-lg bg-[#012B41] text-white shadow-sm">
          <div className="flex items-center gap-4">
            <div className="w-[40%]">
              <p className="text-xs text-gray-300 mb-1">Start Date</p>
              <DatePicker
                selected={startDate}
                onChange={(date) => setStartDate(date)}
                placeholder="Start Date"
                className="w-full h-7 text-xs px-2 rounded bg-white/10 border-0 text-white placeholder:text-gray-400"
              />
            </div>
            <div className="w-[40%]">
              <p className="text-xs text-gray-300 mb-1">End Date</p>
              <DatePicker
                selected={endDate}
                onChange={(date) => setEndDate(date)}
                placeholder="End Date"
                className="w-full h-7 text-xs px-2 rounded bg-white/10 border-0 text-white placeholder:text-gray-400"
              />
            </div>
            <div className="w-[10%] flex justify-center">
              <Button
                size="sm"
                className="bg-blue-500 hover:bg-blue-600 h-8 w-8 p-0 rounded-full flex items-center justify-center"
                onClick={handleDownloadExcel}
                disabled={isLoading || !startDate || !endDate}
                title="Download Excel Report"
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Download className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Data Display & Controls Row */}
      <div className="grid grid-cols-12 gap-2">
        {/* Marking Data */}
        <div className="col-span-5 p-2 rounded-xl bg-white shadow-sm">
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
        <div className="col-span-5 p-2 rounded-xl bg-white shadow-sm">
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
        <div className="col-span-2 p-2 rounded-xl bg-white shadow-sm">
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
            <Button
              className="flex-1 bg-red-500 hover:bg-red-600 text-[11px] font-medium h-8 rounded-lg shadow-sm px-1"
              onClick={testToast}
              title="Test Toast"
            >
              Test
            </Button>
          </div>
        </div>
      </div>

      {/* Table section - direct render */}
      <div className="flex-1 min-h-0">
        {isTableLoading ? (
          <div className="h-full flex items-center justify-center bg-white rounded-xl shadow-sm">
            <LoadingSpinner />
          </div>
        ) : (
          <StyledTable2
            data={csvData?.data || []}
            hasMore={hasMore}
            onLoadMore={loadMoreData}
            onRefresh={handleManualRefresh}
            isLoading={isTableLoading}
            totalRecords={totalRecords}
          />
        )}
      </div>
    </div>
  );
}

export default Page;
