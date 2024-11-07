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
      const response = await fetch('/api/serial-config');
      if (!response.ok) throw new Error('Failed to fetch configuration');
      const data = await response.json();
      setSerialConfig(data);
    } catch (error) {
      console.error('Error fetching config:', error);
      toast.error('Failed to load serial number configuration');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
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

  if (status === 'loading') {
    return <LoadingSpinner />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 p-6">
      <Card className="max-w-2xl mx-auto p-8 shadow-lg">
        <h1 className="text-3xl font-bold mb-8 text-gray-800">Serial Number Configuration</h1>

        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="grid gap-6">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700">Initial Value</label>
              <Input
                type="number"
                value={serialConfig.initialValue}
                onChange={(e) =>
                  setSerialConfig((prev) => ({
                    ...prev,
                    initialValue: e.target.value,
                  }))
                }
                placeholder="Enter initial serial number"
                className="h-11 text-base"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700">Current Value</label>
              <Input
                type="number"
                value={serialConfig.currentValue}
                readOnly
                className="h-11 text-base bg-gray-50 border-gray-200 text-gray-500"
              />
              <p className="text-xs text-gray-500">
                This value is read-only and updates automatically
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700">Reset Value</label>
              <Input
                type="number"
                value={serialConfig.resetValue}
                onChange={(e) =>
                  setSerialConfig((prev) => ({
                    ...prev,
                    resetValue: e.target.value,
                  }))
                }
                placeholder="Enter reset value"
                className="h-11 text-base"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700">Daily Reset Time</label>
              <Input
                type="time"
                value={serialConfig.resetTime}
                onChange={(e) =>
                  setSerialConfig((prev) => ({
                    ...prev,
                    resetTime: e.target.value,
                  }))
                }
                className="h-11 text-base w-48"
                required
              />
              <p className="text-xs text-gray-500">
                The serial number will automatically reset at this time every day
              </p>
            </div>
          </div>

          <div className="flex gap-4 pt-4">
            <Button
              type="submit"
              disabled={isLoading}
              className="flex-1 h-11 text-base font-semibold"
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
              variant="destructive"
              onClick={handleReset}
              disabled={isLoading}
              className="flex-1 h-11 text-base font-semibold"
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
      </Card>
    </div>
  );
}

export default SerialConfig;
