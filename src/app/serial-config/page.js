'use client';
import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { useProtectedRoute } from '../../../hooks/useProtectedRoute.js';

function SerialConfig() {
  const [serialConfig, setSerialConfig] = useState({
    initialValue: '',
    currentValue: '',
    resetValue: '',
    resetInterval: 'daily', // daily, weekly, monthly, yearly
  });
  const [isLoading, setIsLoading] = useState(false);
  const { status } = useProtectedRoute();

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
    <div className="min-h-screen bg-gray-100 p-6">
      <Card className="max-w-2xl mx-auto p-6">
        <h1 className="text-2xl font-bold mb-6">Serial Number Configuration</h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Initial Value</label>
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
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Current Value (Read-only)</label>
              <Input
                type="number"
                value={serialConfig.currentValue}
                readOnly
                className="bg-gray-50"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Reset Value</label>
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
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Reset Interval</label>
              <select
                className="w-full p-2 border rounded-md"
                value={serialConfig.resetInterval}
                onChange={(e) =>
                  setSerialConfig((prev) => ({
                    ...prev,
                    resetInterval: e.target.value,
                  }))
                }
              >
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
                <option value="yearly">Yearly</option>
              </select>
            </div>
          </div>

          <div className="flex gap-4">
            <Button type="submit" disabled={isLoading} className="flex-1">
              {isLoading ? 'Saving...' : 'Save Configuration'}
            </Button>

            <Button
              type="button"
              variant="destructive"
              onClick={handleReset}
              disabled={isLoading}
              className="flex-1"
            >
              {isLoading ? 'Resetting...' : 'Reset Serial Number'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}

export default SerialConfig;
