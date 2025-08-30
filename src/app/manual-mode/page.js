/* eslint-disable consistent-return */
'use client';
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useSocket } from '@/SocketContext';
import { toast } from 'react-toastify';

const ManualMode = () => {
  const socket = useSocket();

  const handleButtonClick = (buttonId) => {
    if (socket) {
      // Emit manual control event for main buttons
      socket.emit('manual_control', { type: buttonId });

      // Show success toast
      toast.success(`${buttonId} activated`, {
        position: 'top-right',
        autoClose: 2000,
      });
    }
  };

  const handleJogControl = (jogType) => {
    if (socket) {
      // Emit jog control event
      socket.emit('jog_control', { type: jogType });

      // Show success toast
      toast.success(`${jogType} activated`, {
        position: 'top-right',
        autoClose: 1500,
      });
    }
  };

  const buttons = [
    { id: 'HMOE', label: 'HOME', category: 'main' },
    { id: 'LoGo', label: 'LoGo', category: 'main' },
    { id: 'CODE', label: 'CODE', category: 'main' },
    { id: 'CASTING_TRACEABILITY', label: 'CASTING TRACEABILITY', category: 'main' },
    { id: 'HUMAN_READABLE', label: 'HUMAN READABLE', category: 'main' },
    { id: 'SCANNER', label: 'SCANNER', category: 'main' },
    { id: 'SCANNER_TRIGGER', label: 'SCANNER TRIGGER', category: 'main' },
    { id: 'MARKON', label: 'MARKON', category: 'main' },
    { id: 'LIGHT', label: 'LIGHT', category: 'main' },
  ];

  const jogButtons = [
    { id: 'X_JOG_PLUS', label: 'X JOG+', category: 'jog' },
    { id: 'X_JOG_MINUS', label: 'X JOG-', category: 'jog' },
    { id: 'Z_JOG_PLUS', label: 'Z JOG+', category: 'jog' },
    { id: 'Z_JOG_MINUS', label: 'Z JOG-', category: 'jog' },
  ];

  return (
    <Card className="w-full max-w-4xl bg-black text-white">
      <CardHeader>
        <CardTitle className="text-3xl font-bold text-center text-yellow-300">
          MANUAL MODE
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Main Control Buttons */}
        <div>
          <h3 className="text-xl font-semibold text-yellow-300 mb-4 text-center">Main Controls</h3>
          <div className="grid grid-cols-3 gap-4">
            {buttons.map((button) => (
              <Button
                key={button.id}
                className={`h-20 text-lg font-semibold bg-purple-300 text-black border-2 border-green-500 hover:bg-purple-400 transition-colors`}
                onClick={() => handleButtonClick(button.id)}
              >
                <div className="text-center">
                  <div className="font-bold">{button.label}</div>
                  <div className="text-xs mt-1 text-gray-600">{button.id}</div>
                </div>
              </Button>
            ))}
          </div>
        </div>

        {/* Jog Control Buttons */}
        <div>
          <h3 className="text-xl font-semibold text-yellow-300 mb-4 text-center">Jog Controls</h3>
          <div className="grid grid-cols-2 gap-4 max-w-md mx-auto">
            {jogButtons.map((button) => (
              <Button
                key={button.id}
                className={`h-16 text-base font-semibold ${
                  button.id.includes('X')
                    ? 'bg-blue-600 hover:bg-blue-700'
                    : 'bg-green-600 hover:bg-green-700'
                } text-white border-2 border-white hover:scale-105 transition-all`}
                onClick={() => handleJogControl(button.id)}
              >
                <div className="text-center">
                  <div className="font-bold">{button.label}</div>
                  <div className="text-xs mt-1 opacity-80">{button.id}</div>
                </div>
              </Button>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ManualMode;
