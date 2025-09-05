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
import { useAlarmManager } from '@/hooks/useAlarmManager';
import AlarmTestComponent from '@/components/AlarmTestComponent';

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
  const { showAlarm } = useAlarmManager();

  // const { status } = useProtectedRoute();
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

  // Add updateProductionRecords function
  const updateProductionRecords = () => {
    // This will trigger a refresh of the CSV data through the existing hook
    refreshData();
  };

  // Manual refresh capability - modify existing refreshData to emit socket event
  const handleManualRefresh = () => {
    if (!socket?.connected) {
      toast.error('Socket not connected');
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
      toast.warning('Part already marked!', {
        description: data.message,
        duration: 3000,
      });
    };

    // Initial data load
    const handleCsvData = (data) => {
      // No need to call updateProductionRecords or refreshData here
      // The useCsvData hook already updates the table data on csv-data event
      console.log('Received csv-data:', data);
    };

    // Automatic refresh on cycle completion
    const handleCycleCompleted = (event) => {
      // No toast here, just log if needed
      console.log('Cycle completed at:', event.timestamp);
      // The csv-data event will follow automatically
    };

    // Detailed cycle status
    const handleScanCycleCompleted = (event) => {
      // No toast here, just log if needed
      console.log(`Cycle ${event.cycleNumber}: ${event.success ? 'SUCCESS' : 'FAILED'}`);
      console.log('Result:', event.result);
    };

    // Handle recent records response
    const handleRecentRecords = (data) => {
      console.log('Received recent records:', data);
      updateProductionRecords();
    };

    // Handle safety violations
    const handleSafetyViolation = (data) => {
      console.log('Safety violation detected:', data);

      // Use alarm manager to show safety violation with high priority
      showAlarm('safety-violation', `Alarm: ${data.violation}`, 'high');

      // You can also update any safety status indicators here
      // For example, you could set a state variable to show safety violation status
    };

    // Handle scanner trigger success
    const handleScannerTriggerSuccess = (data) => {
      console.log('Scanner triggered successfully:', data);
      toast.success('Scanner triggered successfully', {
        position: 'top-right',
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });
    };

    // Handle marking success
    const handleMarkOnSuccess = (data) => {
      console.log('Marking activated successfully:', data);
      toast.success('Marking activated successfully', {
        position: 'top-right',
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });
    };

    // Handle light on success
    const handleLightOnSuccess = (data) => {
      console.log('Light activated successfully:', data);
      toast.success('Light activated successfully', {
        position: 'top-right',
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });
    };

    // Register all socket event handlers
    socket.on('marking_data', handleMarkingData);
    socket.on('scanner_read', handleScannerData);
    socket.on('first_scan_ok', handleFirstScanOk);
    socket.on('csv-data', handleCsvData);
    socket.on('cycle-completed', handleCycleCompleted);
    socket.on('scan-cycle-completed', handleScanCycleCompleted);
    socket.on('recent-records', handleRecentRecords);
    socket.on('safety_violation', handleSafetyViolation);
    socket.on('scanner_trigger_success', handleScannerTriggerSuccess);
    socket.on('mark_on_success', handleMarkOnSuccess);
    socket.on('light_on_success', handleLightOnSuccess);

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
      socket.off('safety_violation', handleSafetyViolation);
      socket.off('scanner_trigger_success', handleScannerTriggerSuccess);
      socket.off('mark_on_success', handleMarkOnSuccess);
      socket.off('light_on_success', handleLightOnSuccess);

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

      // Format the data as per the requirements with piece number calculation
      const formattedData = data.map((row) => ({
        'Piece #': calculatePieceNumber(row.Timestamp, data),
        'Serial No': row.SerialNumber || 'N/A',
        'Model No': row.ModelNumber || 'N/A',
        'Marking Data': row.MarkingData,
        'Scanner Data': row.ScannerData,
        Result: row.Result,
        Timestamp: format(new Date(row.Timestamp), 'dd/MM/yyyy HH:mm:ss'),
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

      toast.success('Report generated successfully!');
    } catch (error) {
      toast.error('Error generating report: ' + error.message);
    } finally {
      setIsLoading(false); // Optional: manage loading state
    }
  };

  // Use the pulse signal hook
  usePulseSignal(socket);

  // Add this line to use the machine events hook
  useMachineEvents(socket);

  // console.log({ csvData });
  return (
    <div className="h-screen w-full p-4 flex flex-col gap-3 bg-slate-50">
      {/* Top Cards - Compact design */}
      <div className="grid grid-cols-2 gap-3">
        {/* Current Model */}
        <div className="p-3 rounded-lg bg-[#012B41] text-white shadow-sm">
          <p className="text-xs text-gray-300 mb-1">Current Model</p>
          <h3 className="text-sm font-semibold truncate">{currentModelNumber || 'N/A'}</h3>
        </div>

        {/* Date Selection & Download */}
        <div className="p-3 rounded-lg bg-[#012B41] text-white shadow-sm">
          <div className="space-y-2">
            <div className="flex gap-3">
              <div className="flex-1">
                <p className="text-xs text-gray-300 mb-1">Start Date</p>
                <DatePicker
                  selected={startDate}
                  onChange={(date) => setStartDate(date)}
                  placeholder="Start Date"
                  className="w-full h-7 text-xs px-2 rounded bg-white/10 border-0 text-white placeholder:text-gray-400"
                />
              </div>
              <div className="flex-1">
                <p className="text-xs text-gray-300 mb-1">End Date</p>
                <DatePicker
                  selected={endDate}
                  onChange={(date) => setEndDate(date)}
                  placeholder="End Date"
                  className="w-full h-7 text-xs px-2 rounded bg-white/10 border-0 text-white placeholder:text-gray-400"
                />
              </div>
              <div className="flex items-end">
                <Button
                  size="sm"
                  className="bg-blue-500 hover:bg-blue-600 h-7 px-3 rounded font-medium flex items-center gap-1"
                  onClick={handleDownloadExcel}
                  disabled={isLoading || !startDate || !endDate}
                  title="Download Excel Report"
                >
                  {isLoading ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <Download className="h-3 w-3" />
                  )}
                  <span className="text-xs">Download</span>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Data Display Row */}
      <div className="grid grid-cols-2 gap-4">
        {/* Marking Data */}
        <div className="p-3 rounded-xl bg-white shadow-sm">
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
        <div className="p-3 rounded-xl bg-white shadow-sm">
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
      </div>

      {/* Alarm Test Component - Remove this in production */}
      {/* <div className="mb-4">
        <AlarmTestComponent />
      </div> */}

      {/* Table section - direct render */}
      <div className="flex-grow">
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
