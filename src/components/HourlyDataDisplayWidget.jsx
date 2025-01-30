'use client';

import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { ChevronLeft, Plus } from 'lucide-react';

export function HourlyDataDisplayWidget() {
  const [hourlyData, setHourlyData] = useState([]);
  const [currentHourData, setCurrentHourData] = useState({ okCount: 0, ngCount: 0, total: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [isExpanded, setIsExpanded] = useState(false);
  const [error, setError] = useState(null);

  // Function to fetch data for all hours
  const fetchAllHourlyData = async () => {
    try {
      setError(null);
      const response = await fetch('/api/reports/hourly-counts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          startDate: new Date().toISOString(),
          endDate: new Date().toISOString(),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.details || 'Failed to fetch data');
      }

      const { hourlyData: data } = await response.json();
      console.log('Received hourly data:', data);

      if (Array.isArray(data)) {
        setHourlyData(data);
      } else {
        throw new Error('Invalid data format received');
      }
    } catch (error) {
      console.error('Error fetching hourly data:', error);
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Function to fetch current hour data
  const fetchCurrentHourData = async () => {
    try {
      const now = new Date();
      const response = await fetch('/api/reports/hourly-counts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          startDate: now.toISOString(),
          endDate: now.toISOString(),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.details || 'Failed to fetch current hour data');
      }

      const { hourlyData: data } = await response.json();
      const currentHour = now.getHours();
      const currentData = data.find((d) => d.hour === currentHour) || {
        hour: currentHour,
        okCount: 0,
        ngCount: 0,
        total: 0,
      };

      setCurrentHourData(currentData);
    } catch (error) {
      console.error('Error fetching current hour data:', error);
    }
  };

  useEffect(() => {
    const initialize = async () => {
      await fetchAllHourlyData();
      await fetchCurrentHourData();
    };

    initialize();

    const currentHourInterval = setInterval(fetchCurrentHourData, 1000);
    const allDataInterval = setInterval(fetchAllHourlyData, 5 * 60 * 1000);

    return () => {
      clearInterval(currentHourInterval);
      clearInterval(allDataInterval);
    };
  }, []);

  // Format hour display (e.g., "6AM - 7AM")
  const formatHourDisplay = (hour) => {
    const period = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 || 12;
    const nextHour = (hour + 1) % 24;
    const nextHour12 = nextHour % 12 || 12;
    const nextPeriod = nextHour >= 12 ? 'PM' : 'AM';
    return `${hour12}${period} - ${nextHour12}${nextPeriod}`;
  };

  return (
    <>
      {/* Toggle Button */}
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
      {isExpanded && (
        <div className="fixed left-0 top-1/2 -translate-y-1/2 flex items-start z-40">
          <div className="bg-white rounded-r-lg shadow-lg transition-all duration-300 ease-in-out w-[400px]">
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

              {error && <div className="p-4 mb-4 text-red-500 bg-red-50 rounded-lg">{error}</div>}

              {isLoading ? (
                <div className="p-4 text-center">
                  <div className="animate-pulse">Loading data...</div>
                </div>
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
                          <span className="text-sm font-medium">
                            {formatHourDisplay(data.hour)}
                          </span>
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
