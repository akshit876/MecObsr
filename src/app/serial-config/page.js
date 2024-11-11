'use client';
import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { useProtectedRoute } from '../../../hooks/useProtectedRoute.js';
import React from 'react';
import { useSocket } from '@/SocketContext';

function SerialConfig() {
  const [serialConfig, setSerialConfig] = useState({
    initialValue: '',
    currentValue: '',
    resetValue: '',
    resetTime: '00:00', // New: store time instead of interval
  });
  const [isLoading, setIsLoading] = useState(false);
  const { status } = useProtectedRoute();
  const socket = useSocket();

  // Fetch current configuration on mount
  useEffect(() => {
    fetchCurrentConfig();
  }, []);

  const fetchCurrentConfig = async () => {
    try {
      // Fetch the serial config
      const configResponse = await fetch('/api/serial-config');
      if (!configResponse.ok) throw new Error('Failed to fetch configuration');
      const configData = await configResponse.json();

      // Fetch the latest record to get current value
      const recordsResponse = await fetch('/api/records/latest');
      if (!recordsResponse.ok) throw new Error('Failed to fetch latest record');
      const latestRecord = await recordsResponse.json();

      // Update state with config data and current value from latest record
      setSerialConfig({
        ...configData,
        currentValue: latestRecord?.SerialNumber || configData.currentValue,
      });
    } catch (error) {
      console.error('Error fetching config:', error);
      toast.error('Failed to load serial number configuration');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Extract hour from resetTime (format: "HH:00")
      const hour = parseInt(serialConfig.resetTime.split(':')[0]);

      // Emit socket event for reset time update
      socket.emit('updateResetTime', {
        hour: hour,
        minute: 0, // Since we only use hour:00 format
      });

      const response = await fetch('/api/serial-config', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(serialConfig),
      });

      if (!response.ok) throw new Error('Failed to update configuration');

      toast.success('Serial number configuration updated successfully');
      fetchCurrentConfig(); // Refresh the displayed values
    } catch (error) {
      console.error('Error updating config:', error);
      toast.error('Failed to update serial number configuration');
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = async () => {
    if (!window.confirm('Are you sure you want to reset the serial number?')) return;

    setIsLoading(true);
    try {
      const response = await fetch('/api/serial-config/reset', {
        method: 'POST',
      });

      if (!response.ok) throw new Error('Failed to reset serial number');

      socket.emit('triggerManualReset', {
        resetValue: serialConfig.resetValue,
        currentValue: serialConfig.currentValue,
        initialValue: serialConfig.initialValue,
        resetTime: serialConfig.resetTime,
      });

      toast.success('Serial number reset successfully');
      fetchCurrentConfig(); // Refresh the displayed values
    } catch (error) {
      console.error('Error resetting serial:', error);
      toast.error('Failed to reset serial number');
    } finally {
      setIsLoading(false);
    }
  };

  // Generate time options for the select box
  const timeOptions = Array.from({ length: 24 }, (_, i) => {
    const hour = i.toString().padStart(2, '0');
    return `${hour}:00`;
  });

  const getAmPm = (time) => {
    if (!time) return 'AM';
    const hour = parseInt(time.split(':')[0]);
    return hour >= 12 ? 'PM' : 'AM';
  };

  const formatTimeDisplay = (time) => {
    if (!time) return '';
    const [hour] = time.split(':');
    const hourNum = parseInt(hour);
    const displayHour = hourNum > 12 ? hourNum - 12 : hourNum === 0 ? 12 : hourNum;
    return `${displayHour}:00 ${getAmPm(time)}`;
  };

  // Add socket listener for reset time response
  useEffect(() => {
    socket.on('resetTimeComplete', (response) => {
      if (!response.success) {
        toast.error(`Failed to update reset time: ${response.error}`);
      }
    });

    return () => {
      socket.off('resetTimeComplete');
    };
  }, [socket]);

  if (status === 'loading') {
    return <LoadingSpinner />;
  }

  return (
    <div className="w-full min-h-screen bg-[#f8fafc] p-6">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
          <div className="p-6">
            <div className="text-center mb-6">
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Serial Number Configuration</h1>
              <p className="text-base text-gray-600">Configure serial number settings and resets</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-4">
                {/* Initial Value */}
                <div className="bg-gray-50 p-5 rounded-lg border border-gray-200">
                  <div className="flex flex-col">
                    <label className="text-base font-medium text-gray-700 mb-3">
                      Initial Value
                    </label>
                    <Input
                      type="number"
                      value={serialConfig.initialValue}
                      onChange={(e) =>
                        setSerialConfig((prev) => ({
                          ...prev,
                          initialValue: e.target.value,
                        }))
                      }
                      className="h-12 text-lg bg-white border-gray-300 focus:border-blue-500 
                               focus:ring-blue-500"
                      required
                    />
                  </div>
                </div>

                {/* Current Value */}
                <div className="bg-gray-50 p-5 rounded-lg border border-gray-200">
                  <div className="flex flex-col">
                    <label className="text-base font-medium text-gray-700 mb-3">
                      Current Value
                    </label>
                    <Input
                      type="number"
                      value={serialConfig.currentValue}
                      readOnly
                      className="h-12 text-lg bg-gray-100 border-gray-300"
                    />
                  </div>
                </div>

                {/* Reset Value */}
                <div className="bg-gray-50 p-5 rounded-lg border border-gray-200">
                  <div className="flex flex-col">
                    <label className="text-base font-medium text-gray-700 mb-3">Reset Value</label>
                    <Input
                      type="number"
                      value={serialConfig.resetValue}
                      onChange={(e) =>
                        setSerialConfig((prev) => ({
                          ...prev,
                          resetValue: e.target.value,
                        }))
                      }
                      className="h-12 text-lg bg-white border-gray-300 focus:border-blue-500 
                               focus:ring-blue-500"
                      required
                    />
                  </div>
                </div>

                {/* Reset Time */}
                <div className="bg-gray-50 p-5 rounded-lg border border-gray-200">
                  <div className="flex flex-col">
                    <label className="text-base font-medium text-gray-700 mb-3">
                      Daily Reset Time
                    </label>
                    <select
                      value={serialConfig.resetTime}
                      onChange={(e) =>
                        setSerialConfig((prev) => ({
                          ...prev,
                          resetTime: e.target.value,
                        }))
                      }
                      className="h-12 text-lg bg-white border-gray-300 rounded-md 
                               focus:border-blue-500 focus:ring-blue-500"
                      required
                    >
                      <option value="" disabled>
                        Select Time
                      </option>
                      {timeOptions.map((time) => (
                        <option key={time} value={time}>
                          {formatTimeDisplay(time)}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              <div className="flex gap-4 mt-8 pt-4 border-t border-gray-200">
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white h-12 text-base font-medium"
                >
                  {isLoading ? (
                    <span className="flex items-center justify-center gap-2">
                      <LoadingSpinner size="sm" />
                      Saving...
                    </span>
                  ) : (
                    'Save Configuration'
                  )}
                </Button>

                <Button
                  type="button"
                  onClick={handleReset}
                  disabled={isLoading}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white h-12 text-base font-medium"
                >
                  {isLoading ? (
                    <span className="flex items-center justify-center gap-2">
                      <LoadingSpinner size="sm" />
                      Resetting...
                    </span>
                  ) : (
                    'Reset Serial Number'
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SerialConfig;
