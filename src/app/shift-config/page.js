'use client';
import React, { useState } from 'react';
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
    { id: 'A', startTime: '', endTime: '', duration: 0 },
    { id: 'B', startTime: '', endTime: '', duration: 0 },
    { id: 'C', startTime: '', endTime: '', duration: 0 },
  ]);

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

  const handleSubmit = () => {
    if (!validateShifts()) return;

    toast.success('Shift settings updated successfully!', {
      position: 'top-right',
      autoClose: 3000,
      theme: 'colored',
    });
  };

  return (
    <div className="flex items-start justify-center min-h-screen bg-gray-100 p-6">
      <ToastContainer />
      <Card className="w-[850px]">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center">SHIFT CONFIGURATION</CardTitle>
        </CardHeader>
        <CardContent>
          {shifts.map((shift) => (
            <div key={shift.id} className="mb-8 p-4 border rounded-lg bg-white">
              <div className="text-lg font-semibold mb-4">Shift {shift.id}</div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2 relative">
                  <Label>Start Time</Label>
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

                <div className="space-y-2 relative">
                  <Label>End Time</Label>
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

                <div className="space-y-2">
                  <Label>Duration (hours)</Label>
                  <div className="h-10 px-3 py-2 border rounded-md bg-gray-50">
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
            className="w-full mt-6"
            disabled={shifts.reduce((sum, shift) => sum + shift.duration, 0) !== 24}
          >
            Update Shift Configuration
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default ShiftSetting;
