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
import { Loader2 } from 'lucide-react';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { useSocket } from '@/SocketContext';
import { usePulseSignal } from '@/hooks/usePulseSignal';
import { useMachineEvents } from '@/hooks/useMachineEvents';
import { useAlarmManager } from '@/hooks/useAlarmManager';
import DashboardAlarmTest from '@/components/DashboardAlarmTest';

function Page() {
  const { csvData, loading: isTableLoading } = useCsvData();
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [currentModelNumber, setCurrentModelNumber] = useState(null);
  const socket = useSocket();
  const { showAlarm } = useAlarmManager();
  console.log({ startDate, endDate });

  // Move useRef declarations to component level
  const markingTimeoutRef = useRef(null);

  const [markingData, setMarkingData] = useState('');

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
      setMarkingData(data.data);
    };

    // Alarm event handlers
    const handleSafetyViolation = (data) => {
      console.log('Safety violation detected on dashboard:', data);
      showAlarm('safety-violation', `Safety Violation: ${data.violation || data.message}`, 'high');
    };

    const handleEmergencyStop = (data) => {
      console.log('Emergency stop detected on dashboard:', data);
      showAlarm(
        'emergency-stop',
        `Emergency Stop: ${data.message || 'System emergency stop activated'}`,
        'high',
      );
    };

    const handleMachineError = (data) => {
      console.log('Machine error detected on dashboard:', data);
      showAlarm('machine-error', `Machine Error: ${data.message || data.error}`, 'normal');
    };

    const handleOperationSuccess = (data) => {
      console.log('Operation success on dashboard:', data);
      showAlarm(
        'operation-success',
        `Success: ${data.message || 'Operation completed successfully'}`,
        'normal',
      );
    };

    const handlePartPresence = (data) => {
      console.log('Part presence issue on dashboard:', data);
      showAlarm('part-presence', `Part Issue: ${data.message || 'Part not detected'}`, 'normal');
    };

    const handleLightCurtain = (data) => {
      console.log('Light curtain issue on dashboard:', data);
      showAlarm(
        'light-curtain',
        `Light Curtain: ${data.message || 'Light curtain interrupted'}`,
        'normal',
      );
    };

    // Register socket event handlers
    socket.on('marking_data', handleMarkingData);

    // Register alarm event handlers
    socket.on('safety_violation', handleSafetyViolation);
    socket.on('emergency_stop', handleEmergencyStop);
    socket.on('machine_error', handleMachineError);
    socket.on('operation_success', handleOperationSuccess);
    socket.on('part_presence', handlePartPresence);
    socket.on('light_curtain', handleLightCurtain);
    socket.on('error', handleMachineError);

    // Cleanup function
    return () => {
      socket.off('marking_data', handleMarkingData);

      // Clear alarm event listeners
      socket.off('safety_violation', handleSafetyViolation);
      socket.off('emergency_stop', handleEmergencyStop);
      socket.off('machine_error', handleMachineError);
      socket.off('operation_success', handleOperationSuccess);
      socket.off('part_presence', handlePartPresence);
      socket.off('light_curtain', handleLightCurtain);
      socket.off('error', handleMachineError);

      // Clear any pending timeouts
      if (markingTimeoutRef.current) {
        clearTimeout(markingTimeoutRef.current);
      }
    };
  }, [socket, showAlarm]);

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

      console.log({ data });

      if (data.length === 0) {
        toast.error('No data found for the specified date range.');
        return;
      }

      // Format the data as per the requirements
      const formattedData = data.map((row, index) => {
        return {
          SerialNumber: index + 1,
          Timestamp: format(new Date(row.Timestamp), 'dd/MM/yyyy HH:mm:ss'),
          MarkingData: row.MarkingData || '',
          Result: row.Result || '',
        };
      });

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
    <div className="h-screen w-full p-4 flex flex-col gap-4 bg-slate-50">
      {/* Top Cards - Single row with all elements */}
      <div className="grid grid-cols-12 gap-4">
        {/* Current Model */}
        <div className="col-span-6 p-4 rounded-xl bg-[#012B41] text-white shadow-sm">
          <p className="text-sm text-gray-300 mb-1">Current Model</p>
          <h3 className="text-xl font-semibold truncate">{currentModelNumber || 'N/A'}</h3>
        </div>

        {/* Date Range and Export */}
        <div className="col-span-6 p-4 rounded-xl bg-[#012B41] text-white shadow-sm">
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <p className="text-sm text-gray-300 mb-1">Start Date</p>
              <DatePicker
                selected={startDate}
                onChange={(date) => setStartDate(date)}
                placeholder="Start Date"
                className="w-full h-9 text-sm px-3 rounded-lg bg-white/10 border-0 text-white placeholder:text-gray-400"
              />
            </div>
            <div className="flex-1">
              <p className="text-sm text-gray-300 mb-1">End Date</p>
              <DatePicker
                selected={endDate}
                onChange={(date) => setEndDate(date)}
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
        <div className="col-span-12 p-3 rounded-xl bg-white shadow-sm">
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
      </div>

      {/* Alarm Test Component - Remove this in production */}
      {/* <DashboardAlarmTest /> */}

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

      {/* Add the HourlyDataDisplayWidget at the end */}
      {/* <HourlyDataDisplayWidget /> */}
    </div>
  );
}

export default Page;
