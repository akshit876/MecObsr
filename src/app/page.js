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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Loader2,
  Download,
  Activity,
  TrendingUp,
  AlertTriangle,
  Square,
  Zap,
  Target,
  BarChart3,
  Clock,
  Settings,
  RefreshCw,
} from 'lucide-react';
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

// Calculate production statistics
const calculateStats = (data) => {
  if (!data || data.length === 0) {
    return {
      totalProduction: 0,
      successRate: 0,
      todayProduction: 0,
      averageCycleTime: 0,
      okCount: 0,
      ngCount: 0,
    };
  }

  const today = new Date();
  const startOfDay = new Date(today);
  startOfDay.setHours(6, 0, 0, 0);

  if (today.getHours() < 6) {
    startOfDay.setDate(startOfDay.getDate() - 1);
  }

  const todayRecords = data.filter((record) => {
    const recordDate = new Date(record.Timestamp);
    return recordDate >= startOfDay;
  });

  const okCount = data.filter((record) => record.Result === 'OK').length;
  const ngCount = data.filter((record) => record.Result === 'NG').length;
  const totalCount = data.length;
  const successRate = totalCount > 0 ? ((okCount / totalCount) * 100).toFixed(1) : 0;

  return {
    totalProduction: totalCount,
    successRate: parseFloat(successRate),
    todayProduction: todayRecords.length,
    averageCycleTime: 0, // Could be calculated if cycle time data is available
    okCount,
    ngCount,
  };
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
  const [currentModelNumber, setCurrentModelNumber] = useState(null);
  const [machineStatus, setMachineStatus] = useState('idle'); // idle, running, error, maintenance
  const socket = useSocket();

  // Move useRef declarations to component level
  const markingTimeoutRef = useRef(null);
  const scannerTimeoutRef = useRef(null);

  const [markingData, setMarkingData] = useState('');
  const [scannerData, setScannerData] = useState('');

  // Calculate stats
  const stats = calculateStats(csvData?.data || []);

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
      setMachineStatus('running');

      // Clear data after 10 seconds
      markingTimeoutRef.current = setTimeout(() => {
        setMarkingData('');
        setMachineStatus('idle');
      }, 10 * 1000);
    };

    const handleScannerData = (data) => {
      if (scannerTimeoutRef.current) {
        clearTimeout(scannerTimeoutRef.current);
      }

      setScannerData(data.data);
      setMachineStatus('running');

      // Clear data after 5 seconds
      scannerTimeoutRef.current = setTimeout(() => {
        setScannerData('');
        setMachineStatus('idle');
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
      console.log('Received csv-data:', data);
      // Update the production records table
      updateProductionRecords();
    };

    // Automatic refresh on cycle completion
    const handleCycleCompleted = (event) => {
      // Refresh the UI with latest data
      console.log('Cycle completed at:', event.timestamp);
      // The csv-data event will follow automatically
      toast.success('Cycle completed successfully', {
        duration: 2000,
      });
    };

    // Detailed cycle status
    const handleScanCycleCompleted = (event) => {
      // Update cycle status indicators
      console.log(`Cycle ${event.cycleNumber}: ${event.success ? 'SUCCESS' : 'FAILED'}`);
      console.log('Result:', event.result);

      // Show toast notification based on cycle result
      if (event.success) {
        toast.success(`Cycle ${event.cycleNumber}: ${event.result}`, {
          duration: 3000,
        });
      } else {
        toast.error(`Cycle ${event.cycleNumber}: FAILED - ${event.result}`, {
          duration: 4000,
        });
      }
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
    };
  }, [socket]);

  const handleDownloadExcel = async () => {
    console.log('Downloading Excel with date range:', startDate, endDate);

    if (!startDate || !endDate) {
      toast.error('Please select both start and end dates');
      return;
    }

    setIsLoading(true);
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

      toast.success('Report generated successfully!');
    } catch (error) {
      toast.error('Error generating report: ' + error.message);
    } finally {
      setIsLoading(false);
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

  const handleLight = () => {
    if (!socket.connected) {
      toast.error('Socket not connected');
      return;
    }
    socket.emit('light_on');
  };

  // Use the pulse signal hook
  usePulseSignal(socket);

  // Add this line to use the machine events hook
  useMachineEvents(socket);

  // Get status color and icon
  const getStatusConfig = (status) => {
    switch (status) {
      case 'running':
        return {
          color: 'text-green-500',
          bgColor: 'bg-green-500/10',
          icon: Activity,
          label: 'Running',
        };
      case 'error':
        return {
          color: 'text-red-500',
          bgColor: 'bg-red-500/10',
          icon: AlertTriangle,
          label: 'Error',
        };
      case 'maintenance':
        return {
          color: 'text-yellow-500',
          bgColor: 'bg-yellow-500/10',
          icon: Settings,
          label: 'Maintenance',
        };
      default:
        return { color: 'text-gray-500', bgColor: 'bg-gray-500/10', icon: Square, label: 'Idle' };
    }
  };

  const statusConfig = getStatusConfig(machineStatus);
  const StatusIcon = statusConfig.icon;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
      {/* Header Section */}
      <div className="border-b border-slate-700 bg-slate-800/50 backdrop-blur-sm">
        <div className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-white">Production Dashboard</h1>
              <p className="text-slate-400 text-sm">
                Real-time manufacturing monitoring &amp; control
              </p>
            </div>
            <div className="flex items-center gap-4">
              {/* Machine Status Indicator */}
              <div
                className={`flex items-center gap-2 px-4 py-2 rounded-lg ${statusConfig.bgColor} border border-slate-600`}
              >
                <StatusIcon className={`w-4 h-4 ${statusConfig.color}`} />
                <span className={`text-sm font-medium ${statusConfig.color}`}>
                  {statusConfig.label}
                </span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleManualRefresh}
                className="border-slate-600 text-slate-300 hover:bg-slate-700"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* KPI Cards Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Total Production */}
          <Card className="bg-slate-800/50 border-slate-700 hover:bg-slate-800/70 transition-colors">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-slate-400">
                  Total Production
                </CardTitle>
                <BarChart3 className="w-5 h-5 text-blue-400" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">
                {stats.totalProduction.toLocaleString()}
              </div>
              <p className="text-xs text-slate-400 mt-1">All time records</p>
            </CardContent>
          </Card>

          {/* Success Rate */}
          <Card className="bg-slate-800/50 border-slate-700 hover:bg-slate-800/70 transition-colors">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-slate-400">Success Rate</CardTitle>
                <TrendingUp className="w-5 h-5 text-green-400" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{stats.successRate}%</div>
              <div className="flex items-center gap-2 mt-1">
                <div className="flex-1 bg-slate-700 rounded-full h-2">
                  <div
                    className="bg-gradient-to-r from-green-400 to-green-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${stats.successRate}%` }}
                  />
                </div>
                <span className="text-xs text-slate-400">
                  {stats.okCount}/{stats.totalProduction}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Today&apos;s Production */}
          <Card className="bg-slate-800/50 border-slate-700 hover:bg-slate-800/70 transition-colors">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-slate-400">
                  Today&apos;s Production
                </CardTitle>
                <Clock className="w-5 h-5 text-yellow-400" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{stats.todayProduction}</div>
              <p className="text-xs text-slate-400 mt-1">Since 6:00 AM</p>
            </CardContent>
          </Card>

          {/* Current Model */}
          <Card className="bg-slate-800/50 border-slate-700 hover:bg-slate-800/70 transition-colors">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-slate-400">Current Model</CardTitle>
                <Target className="w-5 h-5 text-purple-400" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-lg font-semibold text-white truncate">
                {currentModelNumber || 'N/A'}
              </div>
              <p className="text-xs text-slate-400 mt-1">Active configuration</p>
            </CardContent>
          </Card>
        </div>

        {/* Control & Data Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Real-time Data Display */}
          <div className="lg:col-span-2 space-y-4">
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-white">Real-time Data</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Marking Data */}
                <div>
                  <label className="text-sm font-medium text-slate-400 mb-2 block">
                    Marking Data
                  </label>
                  <div
                    className={`p-4 rounded-lg border transition-all duration-300 ${
                      markingData
                        ? 'bg-blue-500/10 border-blue-500/30 text-blue-300'
                        : 'bg-slate-700/50 border-slate-600 text-slate-400'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-2 h-2 rounded-full ${markingData ? 'bg-blue-400 animate-pulse' : 'bg-slate-500'}`}
                      />
                      <span className="font-mono text-sm">
                        {markingData || 'Waiting for marking data...'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Scanner Data */}
                <div>
                  <label className="text-sm font-medium text-slate-400 mb-2 block">
                    Scanner Data
                  </label>
                  <div
                    className={`p-4 rounded-lg border transition-all duration-300 ${
                      scannerData
                        ? 'bg-green-500/10 border-green-500/30 text-green-300'
                        : 'bg-slate-700/50 border-slate-600 text-slate-400'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-2 h-2 rounded-full ${scannerData ? 'bg-green-400 animate-pulse' : 'bg-slate-500'}`}
                      />
                      <span className="font-mono text-sm">
                        {scannerData || 'Waiting for scanner data...'}
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Manual Controls */}
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-white">Manual Controls</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button
                onClick={handleScannerTrigger}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white border-0 h-12 text-sm font-medium"
              >
                <Zap className="w-4 h-4 mr-2" />
                Scanner Trigger
              </Button>
              <Button
                onClick={handleMarkOn}
                className="w-full bg-green-600 hover:bg-green-700 text-white border-0 h-12 text-sm font-medium"
              >
                <Target className="w-4 h-4 mr-2" />
                Mark On
              </Button>
              <Button
                onClick={handleLight}
                className="w-full bg-yellow-600 hover:bg-yellow-700 text-white border-0 h-12 text-sm font-medium"
              >
                <Zap className="w-4 h-4 mr-2" />
                Work Light
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Report Generation Section */}
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-white">Report Generation</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium text-slate-400 mb-2 block">Start Date</label>
                <DatePicker
                  selected={startDate}
                  onChange={(date) => setStartDate(date)}
                  placeholder="Select start date"
                  className="w-full bg-slate-700 border-slate-600 text-white placeholder:text-slate-400 rounded-lg"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-400 mb-2 block">End Date</label>
                <DatePicker
                  selected={endDate}
                  onChange={(date) => setEndDate(date)}
                  placeholder="Select end date"
                  className="w-full bg-slate-700 border-slate-600 text-white placeholder:text-slate-400 rounded-lg"
                />
              </div>
              <div className="flex items-end">
                <Button
                  onClick={handleDownloadExcel}
                  disabled={isLoading || !startDate || !endDate}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white border-0 h-10"
                >
                  {isLoading ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Download className="w-4 h-4 mr-2" />
                  )}
                  Generate Report
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Production Records Table */}
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-white">Production Records</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {isTableLoading ? (
              <div className="h-64 flex items-center justify-center">
                <div className="flex items-center gap-2 text-slate-400">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Loading production data...</span>
                </div>
              </div>
            ) : (
              <div className="bg-slate-900/50">
                <StyledTable2
                  data={csvData?.data || []}
                  hasMore={hasMore}
                  onLoadMore={loadMoreData}
                  onRefresh={handleManualRefresh}
                  isLoading={isTableLoading}
                  totalRecords={totalRecords}
                />
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default Page;
