'use client';
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useSocket } from '@/SocketContext';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const ShiftSetting = () => {
  const socket = useSocket();
  const [shifts, setShifts] = useState({
    A: '',
    B: '',
    C: '',
  });
  const [currentShift, setCurrentShift] = useState('A');

  useEffect(() => {
    socket.on('shift-update', (data) => {
      setShifts((prevShifts) => ({ ...prevShifts, ...data }));
      toast.info('Shift times updated!', {
        position: 'top-right',
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });
    });

    socket.on('current-shift-update', (shift) => {
      setCurrentShift(shift);
      toast.info(`Current shift changed to ${shift}`, {
        position: 'top-right',
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const handleShiftChange = (shift, value) => {
    const newShifts = { ...shifts, [shift]: value };
    setShifts(newShifts);
    socket.emit('shift-change', { [shift]: value });
  };

  const validateTimeFormat = (time) => {
    const regex = /^([01]\d|2[0-3]):([0-5]\d)$/;
    return regex.test(time);
  };

  const handleSubmit = () => {
    // Validate all shifts
    for (const [shift, time] of Object.entries(shifts)) {
      if (!validateTimeFormat(time)) {
        toast.error(`Invalid time format for Shift ${shift}. Use HH:MM format (24-hour)`, {
          position: 'top-right',
          autoClose: 5000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
        });
        return;
      }
    }

    // Emit the shift settings to the server
    socket.emit('update-shifts', shifts);
    toast.success('Shift settings updated successfully!', {
      position: 'top-right',
      autoClose: 3000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
      theme: 'colored',
    });
  };

  return (
    <div className="flex items-start justify-center min-h-screen bg-gray-100">
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="colored"
      />
      <Card className="w-[850px]">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center">SHIFT SETTING</CardTitle>
        </CardHeader>
        <CardContent>
          {Object.entries(shifts).map(([shift, time]) => (
            <div key={shift} className="mb-4">
              <Label htmlFor={`shift-${shift}`} className="text-lg font-semibold">
                {shift} SHIFT
              </Label>
              <Input
                id={`shift-${shift}`}
                value={time}
                onChange={(e) => handleShiftChange(shift, e.target.value)}
                className="mt-1 text-2xl font-bold text-yellow-400 bg-black border-green-500"
                placeholder="HH:MM"
                onBlur={(e) => {
                  if (e.target.value && !validateTimeFormat(e.target.value)) {
                    toast.warning(`Please use HH:MM format for Shift ${shift}`, {
                      position: 'top-right',
                      autoClose: 3000,
                    });
                  }
                }}
              />
            </div>
          ))}
          <div className="mt-6">
            <Label className="text-lg font-semibold">Current Shift</Label>
            <div className="text-2xl font-bold text-yellow-400">{currentShift}</div>
          </div>
          <div className="mt-4">
            <Button onClick={handleSubmit} className="w-full">
              Update Shifts
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ShiftSetting;
