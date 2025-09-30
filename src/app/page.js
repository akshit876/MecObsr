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
import { useSafetySocket } from '@/SafetySocketContext';
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
  console.log('🎨 showToast called with:', { type, message, options });

  try {
    // Clear all existing toasts first
    if (toast && typeof toast.dismiss === 'function') {
      toast.dismiss();
    }

    // Show toast immediately without delay
    let toastId;
    if (type === 'error' && toast && typeof toast.error === 'function') {
      toastId = toast.error(message, options);
    } else if (type === 'success' && toast && typeof toast.success === 'function') {
      toastId = toast.success(message, options);
    } else if (type === 'warning' && toast && typeof toast.warning === 'function') {
      toastId = toast.warning(message, options);
    } else if (toast && typeof toast.info === 'function') {
      toastId = toast.info(message, options);
    }
    console.log('✅ Toast method called successfully, toastId:', toastId);
  } catch (error) {
    console.error('❌ Error calling toast method:', error);
  }
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
  const safetySocket = useSafetySocket();

  // const { status } = useProtectedRoute();
  console.log({ startDate, endDate });

  // Move useRef declarations to component level
  const markingTimeoutRef = useRef(null);
  const scannerTimeoutRef = useRef(null);
  const currentSafetyToastRef = useRef(null);
  const safetyViolationTimeoutRef = useRef(null);

  const [markingData, setMarkingData] = useState('');
  const [scannerData, setScannerData] = useState('');
  const [safetySocketConnected, setSafetySocketConnected] = useState(false);

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

    const handleNoCodeFound = (data) => {
      showToast('error', '❌ NO CODE FOUND! ❌', {
        description: data.message || 'No marking code detected during middle scan',
        duration: 5000,
        style: {
          fontSize: '16px',
          fontWeight: 'bold',
          textAlign: 'center',
          backgroundColor: '#dc2626',
          color: 'white',
          border: '3px solid #b91c1c',
          borderRadius: '8px',
          boxShadow: '0 4px 12px rgba(220, 38, 38, 0.4)',
        },
        bodyStyle: {
          fontSize: '14px',
          fontWeight: '600',
        },
      });
    };

    const handleSafetyViolation = (data) => {
      const violationMessages = {
        'Part not present': '🚨 PART NOT PRESENT! 🚨',
        'Emergency stop activated': '🚨 EMERGENCY STOP! 🚨',
        'Safety sensor not engaged': '🚨 SAFETY SENSOR ERROR! 🚨',
      };

      const message = violationMessages[data.violation] || '🚨 SAFETY VIOLATION! 🚨';
      const description = `${data.violation} (Register: ${data.register}, Value: ${data.value})`;

      showToast('error', message, {
        description: description,
        duration: 8000, // Longer duration for safety violations
        style: {
          fontSize: '18px',
          fontWeight: 'bold',
          textAlign: 'center',
          backgroundColor: '#dc2626',
          color: 'white',
          border: '4px solid #b91c1c',
          borderRadius: '10px',
          boxShadow: '0 6px 20px rgba(220, 38, 38, 0.6)',
        },
        bodyStyle: {
          fontSize: '16px',
          fontWeight: '700',
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

    // Register all socket event handlers
    socket.on('marking_data', handleMarkingData);
    socket.on('scanner_read', handleScannerData);
    socket.on('first_scan_ok', handleFirstScanOk);
    socket.on('no_code_found', handleNoCodeFound);
    socket.on('safety_violation', handleSafetyViolation);
    socket.on('csv-data', handleCsvData);
    socket.on('cycle-completed', handleCycleCompleted);
    socket.on('scan-cycle-completed', handleScanCycleCompleted);
    socket.on('recent-records', handleRecentRecords);

    // Cleanup function
    return () => {
      // Clear socket listeners
      socket.off('marking_data', handleMarkingData);
      socket.off('scanner_read', handleScannerData);
      socket.off('first_scan_ok', handleFirstScanOk);
      socket.off('no_code_found', handleNoCodeFound);
      socket.off('safety_violation', handleSafetyViolation);
      socket.off('csv-data', handleCsvData);
      socket.off('cycle-completed', handleCycleCompleted);
      socket.off('scan-cycle-completed', handleScanCycleCompleted);
      socket.off('recent-records', handleRecentRecords);

      // Clear any pending timeouts
      if (markingTimeoutRef.current) {
        clearTimeout(markingTimeoutRef.current);
      }
      if (scannerTimeoutRef.current) {
        clearTimeout(scannerTimeoutRef.current);
      }
      if (safetyViolationTimeoutRef.current) {
        clearTimeout(safetyViolationTimeoutRef.current);
      }
    };
  }, [socket]);

  // Safety Socket Event Handlers (Port 3005)
  useEffect(() => {
    console.log('Safety socket useEffect triggered, safetySocket:', safetySocket);
    if (!safetySocket) {
      console.log('No safety socket available, skipping event handlers');
      setSafetySocketConnected(false);
      return;
    }

    // Track connection status
    const handleConnect = () => {
      console.log('✅ Safety Socket Connected!');
      setSafetySocketConnected(true);
    };

    const handleDisconnect = () => {
      console.log('❌ Safety Socket Disconnected!');
      setSafetySocketConnected(false);
    };

    safetySocket.on('connect', handleConnect);
    safetySocket.on('disconnect', handleDisconnect);

    const handleSafetyViolation3005 = (data) => {
      console.log('🚨 SAFETY VIOLATION HANDLER TRIGGERED! 🚨');
      console.log('Safety violation from port 3005:', data);
      console.log('Data value:', data.value, 'Type:', typeof data.value);

      // Check if this is a violation activation (value = true/1) or deactivation (value = false/0)
      const isViolationActive =
        data.value === true || data.value === 1 || data.value === '1' || data.value === 'true';

      console.log('Is violation active?', isViolationActive);

      // Clear any existing timeout
      if (safetyViolationTimeoutRef.current) {
        clearTimeout(safetyViolationTimeoutRef.current);
      }

      // Only show toast when violation is ACTIVE (turned ON)
      if (isViolationActive) {
        // Debounce safety violations to prevent multiple toasts
        safetyViolationTimeoutRef.current = setTimeout(() => {
          // Dismiss any existing safety toast first
          if (currentSafetyToastRef.current) {
            console.log('🚫 Dismissing previous safety toast');
            toast.dismiss(currentSafetyToastRef.current);
            currentSafetyToastRef.current = null;
          }

          const violationMessages = {
            'Part not present': '🚨 PART NOT PRESENT! 🚨',
            'Emergency stop activated': '🚨 EMERGENCY STOP! 🚨',
            'Safety sensor not engaged': '🚨 SAFETY SENSOR ERROR! 🚨',
            'Light curtain violation': '🚨 LIGHT CURTAIN VIOLATION! 🚨',
            'Door open violation': '🚨 DOOR OPEN VIOLATION! 🚨',
            'Pressure sensor violation': '🚨 PRESSURE SENSOR VIOLATION! 🚨',
            'Temperature violation': '🚨 TEMPERATURE VIOLATION! 🚨',
            'Vibration violation': '🚨 VIBRATION VIOLATION! 🚨',
          };

          const message = violationMessages[data.violation] || '🚨 SAFETY VIOLATION! 🚨';
          const description = `${data.violation} (Register: ${data.register}, Value: ${data.value})`;

          console.log('🎨 About to show toast with message:', message);

          try {
            // Show new safety toast and store its ID
            currentSafetyToastRef.current = toast.error(message, {
              description: description,
              duration: 8000,
              onClose: () => {
                console.log('🚫 Safety toast closed');
                currentSafetyToastRef.current = null;
              },
            });
            console.log('✅ Safety toast displayed, ID:', currentSafetyToastRef.current);
          } catch (error) {
            console.error('❌ Error showing safety toast:', error);
          }
        }, 500); // 500ms debounce delay
      } else {
        // Violation is cleared (turned OFF) - dismiss any existing safety toast
        console.log('🚫 Safety violation cleared, dismissing any existing safety toast');
        if (currentSafetyToastRef.current) {
          console.log('🚫 Dismissing safety toast due to violation cleared');
          toast.dismiss(currentSafetyToastRef.current);
          currentSafetyToastRef.current = null;
        }
      }
    };

    const handleAlarmCleared = (data) => {
      console.log('Alarm cleared from port 3005:', data);

      // Dismiss any existing safety toast when alarm is cleared
      if (currentSafetyToastRef.current) {
        console.log('🚫 Dismissing safety toast due to alarm cleared');
        toast.dismiss(currentSafetyToastRef.current);
        currentSafetyToastRef.current = null;
      }

      showToast('success', '✅ ALARM CLEARED! ✅', {
        description: 'All safety alarms have been cleared',
        duration: 3000,
      });
    };

    const handleSystemStatus = (data) => {
      console.log('System status from port 3005:', data);
      if (data.status === 'error' || data.status === 'critical') {
        showToast('error', '⚠️ SYSTEM STATUS ALERT! ⚠️', {
          description: `System Status: ${data.status.toUpperCase()}`,
          duration: 5000,
        });
      }
    };

    // Add a general event listener to catch any events
    const handleAnyEvent = (eventName, data) => {
      console.log(`🔍 Safety Socket Event Received: ${eventName}`, data);
      console.log(`🔍 Event data type:`, typeof data);
      console.log(`🔍 Event data keys:`, Object.keys(data || {}));

      // Log all event data for debugging
      if (data && typeof data === 'object') {
        console.log(`🔍 Full event data:`, JSON.stringify(data, null, 2));
      }

      // If it's a safety_violation event, also trigger the handler
      if (eventName === 'safety_violation') {
        console.log('🚨 General listener triggering safety violation handler...');
        handleSafetyViolation3005(data);
      }
    };

    // Register safety socket event handlers
    console.log('🔧 Registering safety socket event handlers...');
    safetySocket.on('safety_violation', (data) => {
      console.log('🎯 SPECIFIC safety_violation handler triggered!', data);
      handleSafetyViolation3005(data);
    });
    safetySocket.on('alarm_cleared', handleAlarmCleared);
    safetySocket.on('system_status', handleSystemStatus);
    safetySocket.on('emergency_stop', handleSafetyViolation3005);
    safetySocket.on('safety_sensor_error', handleSafetyViolation3005);
    safetySocket.on('light_curtain_violation', handleSafetyViolation3005);
    safetySocket.on('door_open_violation', handleSafetyViolation3005);
    safetySocket.on('pressure_violation', handleSafetyViolation3005);
    safetySocket.on('temperature_violation', handleSafetyViolation3005);
    safetySocket.on('vibration_violation', handleSafetyViolation3005);
    console.log('✅ Safety socket event handlers registered');

    // Also listen for safety events on the main socket (port 3002) as fallback
    if (socket) {
      console.log('Adding safety event listeners to main socket (port 3002) as fallback...');
      socket.on('safety_violation', handleSafetyViolation3005);
      socket.on('alarm_cleared', handleAlarmCleared);
      socket.on('system_status', handleSystemStatus);
    }

    // Add general event listener for debugging
    safetySocket.onAny(handleAnyEvent);

    // Also add individual listeners for all possible safety events to debug
    const safetyEvents = [
      'safety_violation',
      'alarm_cleared',
      'system_status',
      'emergency_stop',
      'safety_sensor_error',
      'light_curtain_violation',
      'door_open_violation',
      'pressure_violation',
      'temperature_violation',
      'vibration_violation',
      'alarm_status',
      'part_not_present',
      'emergency_stop_activated',
    ];

    safetyEvents.forEach((eventName) => {
      safetySocket.on(eventName, (data) => {
        console.log(`🎯 ${eventName.toUpperCase()} event received:`, data);
        if (
          eventName === 'safety_violation' ||
          eventName === 'part_not_present' ||
          eventName === 'emergency_stop_activated'
        ) {
          handleSafetyViolation3005(data);
        }
      });
    });

    // Test function to manually trigger safety violation (for debugging)
    const testSafetyViolation = () => {
      console.log('🧪 Testing safety violation handler...');
      handleSafetyViolation3005({
        timestamp: '2025-09-30T11:35:02.000Z',
        violation: 'Part not present',
        register: '1490.0',
        value: true,
        severity: 'critical',
        action: 'stop_cycle',
        alarmType: 'part_not_present',
        service: 'independent',
      });
    };

    // Test function for alarm cleared
    const testAlarmCleared = () => {
      console.log('🧪 Testing alarm cleared handler...');
      handleAlarmCleared({
        timestamp: '2025-09-30T11:35:02.000Z',
        message: 'All alarms cleared',
      });
    };

    // Make test function available globally for debugging
    window.testSafetyViolation = testSafetyViolation;
    window.testAlarmCleared = testAlarmCleared;
    window.safetySocket = safetySocket; // Make socket available for debugging

    // Test function to emit safety event from main socket
    const testMainSocketSafety = () => {
      console.log('🧪 Testing safety event from main socket (port 3002)...');
      if (socket) {
        socket.emit('safety_violation', {
          timestamp: '2025-09-30T11:35:02.000Z',
          violation: 'Part not present',
          register: '1490.0',
          value: true,
          severity: 'critical',
          action: 'stop_cycle',
          alarmType: 'part_not_present',
          service: 'independent',
        });
      } else {
        console.log('❌ Main socket not available');
      }
    };
    window.testMainSocketSafety = testMainSocketSafety;

    // Register event handlers with a small delay to ensure socket is ready
    setTimeout(() => {
      console.log('🔧 Registering safety event handlers...');
      safetySocket.on('safety_violation', (data) => {
        console.log('🎯 SPECIFIC safety_violation handler triggered!', data);
        handleSafetyViolation3005(data);
      });
      safetySocket.on('alarm_cleared', handleAlarmCleared);
      safetySocket.on('system_status', handleSystemStatus);
      safetySocket.on('emergency_stop', handleSafetyViolation3005);
      safetySocket.on('safety_sensor_error', handleSafetyViolation3005);
      safetySocket.on('light_curtain_violation', handleSafetyViolation3005);
      safetySocket.on('door_open_violation', handleSafetyViolation3005);
      safetySocket.on('pressure_violation', handleSafetyViolation3005);
      safetySocket.on('temperature_violation', handleSafetyViolation3005);
      safetySocket.on('vibration_violation', handleSafetyViolation3005);
      safetySocket.onAny(handleAnyEvent);
      console.log('✅ Safety socket event handlers registered');
    }, 100);

    // Cleanup function
    return () => {
      console.log('Cleaning up safety socket event listeners...');
      safetySocket.off('connect', handleConnect);
      safetySocket.off('disconnect', handleDisconnect);
      safetySocket.off('safety_violation', handleSafetyViolation3005);
      safetySocket.off('alarm_cleared', handleAlarmCleared);
      safetySocket.off('system_status', handleSystemStatus);
      safetySocket.off('emergency_stop', handleSafetyViolation3005);
      safetySocket.off('safety_sensor_error', handleSafetyViolation3005);
      safetySocket.off('light_curtain_violation', handleSafetyViolation3005);
      safetySocket.off('door_open_violation', handleSafetyViolation3005);
      safetySocket.off('pressure_violation', handleSafetyViolation3005);
      safetySocket.off('temperature_violation', handleSafetyViolation3005);
      safetySocket.off('vibration_violation', handleSafetyViolation3005);
      safetySocket.offAny(handleAnyEvent);

      // Cleanup main socket safety events
      if (socket) {
        socket.off('safety_violation', handleSafetyViolation3005);
        socket.off('alarm_cleared', handleAlarmCleared);
        socket.off('system_status', handleSystemStatus);
      }

      // Clear safety violation timeout
      if (safetyViolationTimeoutRef.current) {
        clearTimeout(safetyViolationTimeoutRef.current);
      }

      setSafetySocketConnected(false);
    };
  }, [safetySocket]);

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

        {/* Safety Socket Status */}
        <div className="col-span-1 p-2 rounded-lg bg-[#012B41] text-white shadow-sm">
          <div className="flex items-center justify-center">
            <div className="text-center">
              <p className="text-xs text-gray-300 mb-1">Safety</p>
              <div className="flex items-center justify-center">
                <span
                  className={`w-2 h-2 rounded-full mr-1 ${safetySocketConnected ? 'bg-green-400' : 'bg-red-400'}`}
                ></span>
                <span className="text-xs">{safetySocketConnected ? 'ON' : 'OFF'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Date Selection */}
        <div className="col-span-9 p-2 rounded-lg bg-[#012B41] text-white shadow-sm">
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
          </div>
          <div className="mt-1 space-y-1">
            {/* <Button
              className="w-full bg-red-600 hover:bg-red-700 text-[10px] font-medium h-6 rounded-lg shadow-sm px-1"
              onClick={() => window.testSafetyViolation && window.testSafetyViolation()}
            >
              Test Safety
            </Button> */}
            {/* <Button
              className="w-full bg-green-600 hover:bg-green-700 text-[10px] font-medium h-6 rounded-lg shadow-sm px-1"
              onClick={() => window.testAlarmCleared && window.testAlarmCleared()}
            >
              Test Alarm Cleared */}
            {/* </Button> */}
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
