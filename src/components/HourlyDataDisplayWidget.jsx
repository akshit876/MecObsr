'use client';

import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';

export function HourlyDataDisplayWidget() {
  const [hourlyData, setHourlyData] = useState([]);
  const [currentHourData, setCurrentHourData] = useState({ okCount: 0, ngCount: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [isExpanded, setIsExpanded] = useState(false);

  // Function to get the start and end time for a specific hour
  const getHourRange = (hour) => {
    const now = new Date();
    const start = new Date(now);

    // Set to today 6 AM as the base
    start.setHours(6, 0, 0, 0);

    // Calculate hours since 6 AM
    const hoursSince6AM = (hour - 6 + 24) % 24;

    // Add the hours to the base time
    start.setHours(start.getHours() + hoursSince6AM);

    // If the hour is less than current 6 AM, it means it's for tomorrow
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
    const nextPeriod = nextHour >= 12 ? 'PM' : 'AM';

    return `${hour12}${period} - ${nextHour12}${nextPeriod}`;
  };

  // Function to fetch data for all hours
  const fetchAllHourlyData = async () => {
    try {
      const now = new Date();
      const today6AM = new Date(now);
      today6AM.setHours(6, 0, 0, 0);

      const tomorrow6AM = new Date(today6AM);
      tomorrow6AM.setDate(tomorrow6AM.getDate() + 1);

      const response = await fetch('/api/reports/hourly-counts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          startDate: today6AM.toISOString(),
          endDate: tomorrow6AM.toISOString(),
        }),
      });

      if (!response.ok) throw new Error('Failed to fetch counts');
      const { hourlyData } = await response.json();

      console.log('Raw API response:', hourlyData);

      // Data is already in the correct format from the API
      setHourlyData(hourlyData);
      setIsLoading(false);
    } catch (error) {
      console.error('Error fetching hourly data:', error);
      setIsLoading(false);
    }
  };

  // Function to fetch current hour data
  const fetchCurrentHourData = async () => {
    const now = new Date();
    const currentHour = now.getHours();
    const start = new Date(now);
    start.setMinutes(0, 0, 0);

    const end = new Date(start);
    end.setHours(end.getHours() + 1);

    try {
      const response = await fetch('/api/reports/hourly-counts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          startDate: start.toISOString(),
          endDate: end.toISOString(),
        }),
      });

      if (!response.ok) throw new Error('Failed to fetch counts');
      const { hourlyData } = await response.json();

      const currentHourData = hourlyData.find((data) => data.hour === currentHour) || {
        hour: currentHour,
        okCount: 0,
        ngCount: 0,
        total: 0,
      };

      setCurrentHourData(currentHourData);
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

  return (
    <>
      {/* Toggle Button - Only show when panel is not expanded */}
      {!isExpanded && (
        <button
          onClick={() => setIsExpanded(true)}
          className="fixed left-[1%] top-[76%] z-50 bg-[#012B41] text-white p-3 rounded-r-lg hover:bg-[#023855] transition-colors shadow-lg flex flex-col items-center gap-2"
        >
          <Plus className="h-6 w-6" />
          <span className="text-xs font-medium">Hourly Data</span>
        </button>
      )}

      {/* Main Panel */}
      {(isExpanded || isLoading) && (
        <div className="fixed left-0 top-1/2 -translate-y-1/2 flex items-start z-40">
          <div
            className={`bg-white rounded-r-lg shadow-lg transition-all duration-300 ease-in-out w-[400px]`}
          >
            <div className="p-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">Hourly Production Data</h3>
                <button
                  onClick={() => setIsExpanded(false)}
                  className="p-1 hover:bg-gray-100 rounded-full"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
              </div>

              {isLoading ? (
                <div className="p-4 text-center">Loading...</div>
              ) : (
                <>
                  {/* Current Hour Highlight */}
                  <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <h4 className="text-sm font-medium text-blue-800">
                      Current Hour ({format(new Date(), 'hh:mm a')})
                    </h4>
                    <div className="grid grid-cols-3 gap-2 mt-2">
                      <div className="text-center">
                        <span className="text-sm text-green-600">
                          OK: {currentHourData.okCount}
                        </span>
                      </div>
                      <div className="text-center">
                        <span className="text-sm text-red-600">NG: {currentHourData.ngCount}</span>
                      </div>
                      <div className="text-center">
                        <span className="text-sm text-gray-600">
                          Total: {currentHourData.total}
                        </span>
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
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
