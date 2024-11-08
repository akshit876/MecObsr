'use client';
import { useState, useEffect } from 'react';
import StyledTable2 from '@/comp/StyledTable2';
import { Button } from '@/components/ui/button';
import { DatePicker } from '@/components/ui/date-picker';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { useSocket } from '@/SocketContext';
import { useCsvData } from '../../hooks/useSocket';
import React from 'react';

export default function Page() {
  const { csvData, loading: isTableLoading } = useCsvData();
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [markingData, setMarkingData] = useState('Waiting for data...');
  const [scannerData, setScannerData] = useState('Waiting for data...');
  const socket = useSocket();

  const handleScannerTrigger = () => {
    socket?.emit('scanner_trigger');
  };

  const handleMarkOn = () => {
    socket?.emit('mark_on');
  };

  const handleLigt = () => {
    socket?.emit('light_control');
  };

  const handleDownloadExcel = () => {
    // Your download logic here
  };

  return (
    <>
      {/* Top Search Bar */}
      <div className="w-full bg-white border-b px-6 py-3">
        <input
          type="search"
          placeholder="Search..."
          className="w-[300px] px-4 py-2 rounded-md border bg-gray-50"
        />
      </div>

      <div className="p-6 space-y-6">
        {/* Header Stats Card */}
        <div className="bg-[#0a2942] rounded-lg overflow-hidden">
          <div className="p-4">
            <h1 className="text-xl text-white font-semibold">Production Monitoring</h1>
            <p className="text-sm text-gray-400">Real-time tracking and analysis</p>
          </div>

          <div className="grid grid-cols-3 gap-4 p-4">
            <div className="bg-[#1a3b55] p-4 rounded-lg">
              <p className="text-sm text-gray-400">Total Production</p>
              <h3 className="text-2xl text-white font-bold">{csvData?.data?.length || 0}</h3>
            </div>
            <div className="bg-[#1a3b55] p-4 rounded-lg">
              <p className="text-sm text-gray-400">Success Rate</p>
              <h3 className="text-2xl text-white font-bold">98.5%</h3>
            </div>
            <div className="bg-[#1a3b55] p-4 rounded-lg">
              <p className="text-sm text-gray-400">Current Model</p>
              <h3 className="text-2xl text-white font-bold">N/A</h3>
            </div>
          </div>
        </div>

        {/* Control Panels */}
        <div className="grid grid-cols-3 gap-6">
          {/* Manual Controls */}
          <div>
            <h2 className="text-sm font-semibold mb-3">Manual Controls</h2>
            <div className="space-y-2">
              <Button
                className="w-full bg-blue-500 hover:bg-blue-600 font-normal"
                onClick={handleScannerTrigger}
              >
                Scanner Trigger
              </Button>
              <Button
                className="w-full bg-blue-500 hover:bg-blue-600 font-normal"
                onClick={handleMarkOn}
              >
                Mark On
              </Button>
              <Button
                className="w-full bg-blue-500 hover:bg-blue-600 font-normal"
                onClick={handleLigt}
              >
                Light Control
              </Button>
            </div>
          </div>

          {/* Current Data */}
          <div>
            <h2 className="text-sm font-semibold mb-3">Current Data</h2>
            <div className="space-y-3">
              <div>
                <label className="text-sm text-gray-600">Marking Data</label>
                <div className="mt-1 p-2 bg-white border rounded-md text-sm">{markingData}</div>
              </div>
              <div>
                <label className="text-sm text-gray-600">Scanner Data</label>
                <div className="mt-1 p-2 bg-white border rounded-md text-sm">{scannerData}</div>
              </div>
            </div>
          </div>

          {/* Report Generation */}
          <div>
            <h2 className="text-sm font-semibold mb-3">Generate Report</h2>
            <div className="space-y-3">
              <DatePicker
                selected={startDate}
                onSelect={setStartDate}
                placeholderText="Start Date"
                className="w-full border rounded-md p-2"
              />
              <DatePicker
                selected={endDate}
                onSelect={setEndDate}
                placeholderText="End Date"
                className="w-full border rounded-md p-2"
              />
              <Button
                className="w-full bg-blue-500 hover:bg-blue-600 font-normal"
                onClick={handleDownloadExcel}
              >
                Download Report
              </Button>
            </div>
          </div>
        </div>

        {/* Production History */}
        <div>
          <h2 className="text-sm font-semibold mb-1">Production History</h2>
          <p className="text-sm text-gray-500 mb-4">Real-time production monitoring data</p>

          {isTableLoading ? (
            <div className="h-[400px] flex items-center justify-center">
              <LoadingSpinner />
            </div>
          ) : (
            <div className="bg-white rounded-lg border">
              <StyledTable2 data={csvData?.data || []} />
            </div>
          )}
        </div>
      </div>
    </>
  );
}
