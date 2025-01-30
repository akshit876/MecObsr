'use client';

import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { ChevronLeft, ChevronRight, Plus, Minus } from 'lucide-react';

export function HourlyDataDisplayWidget() {
  const [hourlyData, setHourlyData] = useState([]);
  const [currentHourData, setCurrentHourData] = useState({ okCount: 0, ngCount: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [isExpanded, setIsExpanded] = useState(false);

  // Function to get the start and end time for a specific hour
  const getHourRange = (hour) => {
    const now = new Date();
    const start = new Date(now);
    start.setHours(hour, 0, 0, 0);

    // If the hour is less than current hour, it's from next day
    if (hour < 6) {
      start.setDate(start.getDate() + 1);
    }

    const end = new Date(start);
    end.setHours(end.getHours() + 1);

    return { start, end };
  };

  // Function to format hour to 12-hour format
  const formatHour = (hour) => {
    const period = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 || 12;
    const nextHour = (hour + 1) % 24;
    const nextHour12 = nextHour % 12 || 12;
    const nextPeriod = hour + 1 >= 12 ? 'PM' : 'AM';

    return `${hour12}${period} - ${nextHour12}${nextPeriod}`;
  };

  // Function to fetch data for all hours
  const fetchAllHourlyData = async () => {
    try {
      const hours = [];
      for (let i = 6; i < 24; i++) hours.push(i);
      for (let i = 0; i < 6; i++) hours.push(i);

      const promises = hours.map(async (hour) => {
        const { start, end } = getHourRange(hour);
        const response = await fetch('/api/reports/counts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            startDate: start.toISOString(),
            endDate: end.toISOString(),
          }),
        });

        if (!response.ok) throw new Error('Failed to fetch counts');
        const data = await response.json();
        return {
          hour,
          okCount: data.okCount || 0,
          ngCount: data.ngCount || 0,
          total: (data.okCount || 0) + (data.ngCount || 0),
        };
      });

      const results = await Promise.all(promises);
      setHourlyData(results);
    } catch (error) {
      console.error('Error fetching hourly data:', error);
    }
  };

  // Function to fetch current hour data
  const fetchCurrentHourData = async () => {
    const now = new Date();
    const currentHour = now.getHours();
    const { start, end } = getHourRange(currentHour);

    try {
      const response = await fetch('/api/reports/counts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          startDate: start.toISOString(),
          endDate: end.toISOString(),
        }),
      });

      if (!response.ok) throw new Error('Failed to fetch counts');
      const data = await response.json();
      setCurrentHourData({
        hour: currentHour,
        okCount: data.okCount || 0,
        ngCount: data.ngCount || 0,
        total: (data.okCount || 0) + (data.ngCount || 0),
      });
    } catch (error) {
      console.error('Error fetching current hour data:', error);
    }
  };

  useEffect(() => {
    const initialize = async () => {
      await fetchAllHourlyData();
      await fetchCurrentHourData();
      setIsLoading(false);
    };

    initialize();

    // Update current hour data every second
    const currentHourInterval = setInterval(fetchCurrentHourData, 1000);
    // Update all data every 5 minutes
    const allDataInterval = setInterval(fetchAllHourlyData, 5 * 60 * 1000);

    return () => {
      clearInterval(currentHourInterval);
      clearInterval(allDataInterval);
    };
  }, []);

  if (isLoading) {
    return (
      <div className="fixed left-0 top-1/2 -translate-y-1/2 z-50">
        <div className="bg-white rounded-r-lg shadow-lg p-4">Loading...</div>
      </div>
    );
  }

  return (
    <div className="fixed left-0 top-1/2 -translate-y-1/2 flex items-start z-50">
      {/* Main Panel */}
      <div
        className={`bg-white rounded-r-lg shadow-lg transition-all duration-300 ease-in-out ${
          isExpanded ? 'w-[400px]' : 'w-0 overflow-hidden'
        }`}
      >
        <div className="p-4">
          <h3 className="text-lg font-semibold mb-4">Hourly Production Data</h3>

          {/* Current Hour Highlight */}
          <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
            <h4 className="text-sm font-medium text-blue-800">
              Current Hour ({format(new Date(), 'hh:mm a')})
            </h4>
            <div className="grid grid-cols-3 gap-2 mt-2">
              <div className="text-center">
                <span className="text-sm text-green-600">OK: {currentHourData.okCount}</span>
              </div>
              <div className="text-center">
                <span className="text-sm text-red-600">NG: {currentHourData.ngCount}</span>
              </div>
              <div className="text-center">
                <span className="text-sm text-gray-600">Total: {currentHourData.total}</span>
              </div>
            </div>
          </div>

          {/* Hourly Data Grid */}
          <div className="grid grid-cols-1 gap-2 max-h-[60vh] overflow-y-auto">
            {hourlyData.map((data) => (
              <div
                key={data.hour}
                className="p-2 bg-gray-50 rounded border border-gray-200 hover:bg-gray-100"
              >
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">{formatHour(data.hour)}</span>
                  <div className="flex gap-3">
                    <span className="text-sm text-green-600">OK: {data.okCount}</span>
                    <span className="text-sm text-red-600">NG: {data.ngCount}</span>
                    <span className="text-sm text-gray-600">Total: {data.total}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Toggle Button */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="bg-[#012B41] text-white p-2 rounded-r-lg hover:bg-[#023855] transition-colors shadow-lg"
      >
        {isExpanded ? <ChevronLeft className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
      </button>
    </div>
  );
}
