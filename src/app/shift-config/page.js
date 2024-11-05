'use client';
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  SelectGroup,
} from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ToastContainer, toast } from 'react-toastify';
import { Check } from 'lucide-react';
import 'react-toastify/dist/ReactToastify.css';

const ShiftSetting = () => {
  const [shifts, setShifts] = useState([
    { id: '1', name: 'A', startTime: '', endTime: '', duration: 0 },
    { id: '2', name: 'B', startTime: '', endTime: '', duration: 0 },
    { id: '3', name: 'C', startTime: '', endTime: '', duration: 0 },
  ]);

  const [isLoading, setIsLoading] = useState(false);

  // Add new state for initial loading
  const [initialLoading, setInitialLoading] = useState(true);

  // Generate time options in 30-minute intervals
  const generateTimeOptions = () => {
    const times = [];
    for (let hour = 0; hour < 24; hour++) {
      for (let minute of ['00', '30']) {
        const timeString = `${hour.toString().padStart(2, '0')}:${minute}`;
        times.push(timeString);
      }
    }
    return times;
  };

  const timeOptions = generateTimeOptions();

  const calculateDuration = (startTime, endTime) => {
    if (!startTime || !endTime) return 0;

    const [startHour, startMinute] = startTime.split(':').map(Number);
    const [endHour, endMinute] = endTime.split(':').map(Number);

    let hours = endHour - startHour;
    let minutes = endMinute - startMinute;

    if (hours < 0) hours += 24;
    if (minutes < 0) {
      hours -= 1;
      minutes += 60;
    }

    return hours + minutes / 60;
  };

  const handleTimeChange = (shiftId, type, value) => {
    setShifts((prevShifts) => {
      return prevShifts.map((shift) => {
        if (shift.id === shiftId) {
          const updatedShift = {
            ...shift,
            [type]: value,
          };

          // Calculate duration if both times are set
          if (type === 'startTime' || type === 'endTime') {
            const otherTime = type === 'startTime' ? shift.endTime : shift.startTime;
            if (value && otherTime) {
              updatedShift.duration = calculateDuration(
                type === 'startTime' ? value : shift.startTime,
                type === 'endTime' ? value : shift.endTime,
              );
            }
          }

          return updatedShift;
        }
        return shift;
      });
    });
  };

  const validateShifts = () => {
    const totalDuration = shifts.reduce((sum, shift) => sum + shift.duration, 0);

    if (Math.abs(totalDuration - 24) > 0.01) {
      // Allow small floating-point differences
      toast.error('Total shift duration must equal 24 hours', {
        position: 'top-right',
        autoClose: 5000,
      });
      return false;
    }

    // Check for overlapping shifts
    for (let i = 0; i < shifts.length; i++) {
      for (let j = i + 1; j < shifts.length; j++) {
        if (shifts[i].startTime && shifts[i].endTime && shifts[j].startTime && shifts[j].endTime) {
          // Add overlap check logic here if needed
        }
      }
    }

    return true;
  };

  const handleSubmit = async () => {
    if (!validateShifts()) return;

    setIsLoading(true);
    try {
      const response = await fetch('/api/shift-config', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          shifts: shifts.map((shift) => ({
            shiftId: shift.id,
            name: shift.name,
            startTime: shift.startTime,
            endTime: shift.endTime,
            duration: shift.duration,
          })),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to save configuration');
      }

      toast.success('Shift settings updated successfully!');
    } catch (error) {
      toast.error(error.message || 'Failed to save shift configuration');
      console.error('Error saving shifts:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleNameChange = (shiftId, value) => {
    setShifts((prevShifts) =>
      prevShifts.map((shift) => (shift.id === shiftId ? { ...shift, name: value } : shift)),
    );
  };

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const response = await fetch('/api/shift-config');
        const data = await response.json();

        if (data.shifts?.length > 0) {
          const formattedShifts = data.shifts.map((shift) => ({
            id: shift.shiftId || shift.id,
            name: shift.name || '',
            startTime: shift.startTime || '',
            endTime: shift.endTime || '',
            duration: shift.duration || 0,
          }));
          setShifts(formattedShifts);
        }
      } catch (error) {
        toast.error('Failed to fetch shift configuration');
        console.error('Error fetching config:', error);
      } finally {
        setInitialLoading(false);
      }
    };

    fetchConfig();
  }, []);

  return (
    <div className="flex items-start justify-center min-h-screen bg-gray-50 p-6">
      <ToastContainer />
      {initialLoading ? (
        <div className="flex items-center justify-center w-[850px] h-[400px] bg-white rounded-lg shadow">
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-gray-500 text-sm">Loading shift configuration...</p>
          </div>
        </div>
      ) : (
        <Card className="w-[850px] bg-white">
          <CardHeader className="pb-3">
            <CardTitle className="text-2xl font-bold text-center text-gray-800">
              SHIFT CONFIGURATION
            </CardTitle>
          </CardHeader>
          <CardContent>
            {shifts.map((shift) => (
              <div key={shift.id} className="mb-6 p-4 border border-gray-200 rounded-lg bg-gray-50">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  {/* Shift Name Input */}
                  <div className="space-y-2">
                    <Label className="text-gray-700">Shift Name</Label>
                    <input
                      type="text"
                      value={shift.name}
                      onChange={(e) => handleNameChange(shift.id, e.target.value)}
                      className="w-full h-10 px-3 py-2 bg-white border border-gray-300 rounded-md text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter shift name"
                    />
                  </div>

                  {/* Start Time */}
                  <div className="space-y-2">
                    <Label className="text-gray-700">Start Time</Label>
                    <Select
                      value={shift.startTime}
                      onValueChange={(value) => handleTimeChange(shift.id, 'startTime', value)}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select start time" />
                      </SelectTrigger>
                      <SelectContent
                        position="popper"
                        className="w-[var(--radix-select-trigger-width)] z-50 bg-white"
                        align="start"
                      >
                        <ScrollArea className="h-[200px] w-full overflow-auto">
                          <div className="p-1">
                            {timeOptions.map((time) => (
                              <SelectItem
                                key={`start-${time}`}
                                value={time}
                                className="relative flex items-center py-2 pl-8 pr-2 cursor-default hover:bg-gray-100 rounded-sm text-sm"
                              >
                                <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
                                  <Check className="h-4 w-4 opacity-0 data-[state=checked]:opacity-100" />
                                </span>
                                <span className="ml-2">{time}</span>
                              </SelectItem>
                            ))}
                          </div>
                        </ScrollArea>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* End Time */}
                  <div className="space-y-2">
                    <Label className="text-gray-700">End Time</Label>
                    <Select
                      value={shift.endTime}
                      onValueChange={(value) => handleTimeChange(shift.id, 'endTime', value)}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select end time" />
                      </SelectTrigger>
                      <SelectContent
                        position="popper"
                        className="w-[var(--radix-select-trigger-width)] z-50 bg-white"
                        align="start"
                      >
                        <ScrollArea className="h-[200px] w-full overflow-auto">
                          <div className="p-1">
                            {timeOptions.map((time) => (
                              <SelectItem
                                key={`end-${time}`}
                                value={time}
                                className="relative flex items-center py-2 pl-8 pr-2 cursor-default hover:bg-gray-100 rounded-sm text-sm"
                              >
                                <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
                                  <Check className="h-4 w-4 opacity-0 data-[state=checked]:opacity-100" />
                                </span>
                                <span className="ml-2">{time}</span>
                              </SelectItem>
                            ))}
                          </div>
                        </ScrollArea>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Duration */}
                  <div className="space-y-2">
                    <Label className="text-gray-700">Duration (hours)</Label>
                    <div className="h-10 px-3 py-2 border border-gray-300 rounded-md bg-gray-100 text-gray-700">
                      {shift.duration.toFixed(1)}
                    </div>
                  </div>
                </div>
              </div>
            ))}

            <div className="mt-4 text-right text-sm text-gray-600">
              Total Duration: {shifts.reduce((sum, shift) => sum + shift.duration, 0).toFixed(1)}{' '}
              hours
            </div>

            <Button
              onClick={handleSubmit}
              className="w-full mt-6 bg-blue-600 hover:bg-blue-700 text-white"
              disabled={shifts.reduce((sum, shift) => sum + shift.duration, 0) !== 24 || isLoading}
            >
              {isLoading ? 'Saving...' : 'Update Shift Configuration'}
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ShiftSetting;
