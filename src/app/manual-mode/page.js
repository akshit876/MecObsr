/* eslint-disable consistent-return */
'use client';
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { toast } from 'react-toastify';
import { getPLCMapping } from '@/constants/plcMapping';

const ManualMode = () => {
  const [activeJogEvents, setActiveJogEvents] = useState(new Set());
  const [isLoading, setIsLoading] = useState(false);

  const handleButtonClick = async (buttonId) => {
    try {
      setIsLoading(true);

      // Get PLC mapping for this button
      const mapping = getPLCMapping(buttonId);
      console.log(`Button clicked: ${buttonId}, Mapping:`, mapping);

      if (!mapping) {
        toast.error(`Unknown button: ${buttonId}`);
        return;
      }

      // Emit event to your existing Node.js backend
      // Your backend should listen for these events and handle PLC control
      const eventData = {
        type: buttonId,
        register: mapping.register,
        bit: mapping.bit,
        description: mapping.description,
      };

      console.log('Emitting manual control event to backend:', eventData);

      // TODO: Replace this with your actual event emission method
      // Example: if using Socket.IO client to your backend
      // socket.emit('manual_control', eventData);

      // For now, simulate success
      toast.success(`${buttonId} activated successfully`);
      console.log('Manual control event emitted:', eventData);
    } catch (error) {
      console.error('Error:', error);
      toast.error(`Error activating ${buttonId}: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleJogStart = async (jogType) => {
    try {
      setIsLoading(true);

      // Get PLC mapping for this jog control
      const mapping = getPLCMapping(jogType);
      console.log(`Jog start: ${jogType}, Mapping:`, mapping);

      if (!mapping) {
        toast.error(`Unknown jog control: ${jogType}`);
        return;
      }

      // Emit jog start event to your existing Node.js backend
      const eventData = {
        type: jogType,
        action: 'start',
        register: mapping.register,
        bit: mapping.bit,
        description: mapping.description,
      };

      console.log('Emitting jog start event to backend:', eventData);

      // TODO: Replace this with your actual event emission method
      // Example: if using Socket.IO client to your backend
      // socket.emit('jog_control', eventData);

      // For now, simulate success
      setActiveJogEvents((prev) => new Set([...prev, jogType]));
      toast.success(`${jogType} started successfully`);
      console.log('Jog start event emitted:', eventData);
    } catch (error) {
      console.error('Error:', error);
      toast.error(`Error starting ${jogType}: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleJogStop = async (jogType) => {
    try {
      setIsLoading(true);

      // Get PLC mapping for this jog control
      const mapping = getPLCMapping(jogType);
      console.log(`Jog stop: ${jogType}, Mapping:`, mapping);

      if (!mapping) {
        toast.error(`Unknown jog control: ${jogType}`);
        return;
      }

      // Emit jog stop event to your existing Node.js backend
      const eventData = {
        type: jogType,
        action: 'stop',
        register: mapping.register,
        bit: mapping.bit,
        description: mapping.description,
      };

      console.log('Emitting jog stop event to backend:', eventData);

      // TODO: Replace this with your actual event emission method
      // Example: if using Socket.IO client to your backend
      // socket.emit('jog_control', eventData);

      // For now, simulate success
      setActiveJogEvents((prev) => {
        const newSet = new Set(prev);
        newSet.delete(jogType);
        return newSet;
      });
      toast.success(`${jogType} stopped successfully`);
      console.log('Jog stop event emitted:', eventData);
    } catch (error) {
      console.error('Error:', error);
      toast.error(`Error stopping ${jogType}: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmergencyStop = async () => {
    if (
      window.confirm(
        'Are you sure you want to execute emergency stop? This will stop all active operations.',
      )
    ) {
      try {
        setIsLoading(true);

        console.log('Emitting emergency stop event to backend');

        // TODO: Replace this with your actual event emission method
        // Example: if using Socket.IO client to your backend
        // socket.emit('emergency_stop');

        // For now, simulate success
        setActiveJogEvents(new Set());
        toast.warning(`Emergency stop executed successfully`);
        console.log('Emergency stop event emitted');
      } catch (error) {
        console.error('Error:', error);
        toast.error(`Emergency stop error: ${error.message}`);
      } finally {
        setIsLoading(false);
      }
    }
  };

  const buttons = [
    { id: 'HOME', label: 'HOME', category: 'main' },
    { id: 'LOGO', label: 'LOGO', category: 'main' },
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
    <div className="h-screen w-full p-4 flex flex-col gap-3 bg-slate-50">
      {/* Header Card */}
      <div className="p-4 rounded-lg bg-[#012B41] text-white shadow-sm">
        <h1 className="text-2xl font-bold text-center">Manual Mode Controls</h1>
        <p className="text-sm text-gray-300 text-center mt-2">
          Professional control interface for machine operations
        </p>
      </div>

      {/* Status Bar */}
      <div className="p-3 rounded-lg bg-white shadow-sm">
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-600">{isLoading ? '🔄 Processing...' : '✅ Ready'}</div>
          <div className="text-sm text-gray-600">Active Operations: {activeJogEvents.size}</div>
        </div>
        {activeJogEvents.size > 0 && (
          <div className="mt-2 text-xs text-orange-600">
            Active: {Array.from(activeJogEvents).join(', ')}
          </div>
        )}
      </div>

      {/* Main Controls Section */}
      <div className="p-4 rounded-xl bg-white shadow-sm">
        <h3 className="text-lg font-semibold text-gray-700 mb-4 text-center">
          Main Control Operations
        </h3>
        <div className="grid grid-cols-3 gap-4">
          {buttons.map((button) => {
            const mapping = getPLCMapping(button.id);
            return (
              <Button
                key={button.id}
                className="h-20 text-base font-semibold bg-[#012B41] hover:bg-[#023855] text-white border-2 border-gray-200 hover:border-gray-300 transition-all duration-200 shadow-sm hover:shadow-md disabled:opacity-50"
                onClick={() => handleButtonClick(button.id)}
                disabled={isLoading}
              >
                <div className="text-center">
                  <div className="font-bold text-sm">{button.label}</div>
                  <div className="text-xs mt-1 text-gray-300 opacity-80">{button.id}</div>
                  {mapping && (
                    <div className="text-xs mt-1 text-blue-200 opacity-80">
                      {mapping.register}.{mapping.bit}
                    </div>
                  )}
                </div>
              </Button>
            );
          })}
        </div>
      </div>

      {/* Jog Controls Section */}
      <div className="p-4 rounded-xl bg-white shadow-sm">
        <h3 className="text-lg font-semibold text-gray-700 mb-4 text-center">Jog Controls</h3>
        <p className="text-sm text-gray-500 text-center mb-4">
          Press and hold for continuous movement, release to stop
        </p>
        <div className="grid grid-cols-2 gap-4 max-w-md mx-auto">
          {jogButtons.map((button) => {
            const isActive = activeJogEvents.has(button.id);
            const mapping = getPLCMapping(button.id);
            return (
              <Button
                key={button.id}
                className={`h-16 text-base font-semibold ${
                  button.id.includes('X')
                    ? isActive
                      ? 'bg-blue-800 ring-4 ring-blue-300'
                      : 'bg-blue-600 hover:bg-blue-700 active:bg-blue-800'
                    : isActive
                      ? 'bg-green-800 ring-4 ring-green-300'
                      : 'bg-green-600 hover:bg-green-700 active:bg-green-800'
                } text-white border-2 border-white transition-all duration-200 shadow-sm hover:shadow-md active:scale-95 disabled:opacity-50`}
                onMouseDown={() => handleJogStart(button.id)}
                onMouseUp={() => handleJogStop(button.id)}
                onTouchStart={() => handleJogStart(button.id)}
                onTouchEnd={() => handleJogStop(button.id)}
                disabled={isLoading}
              >
                <div className="text-center">
                  <div className="font-bold">{button.label}</div>
                  <div className="text-xs mt-1 opacity-80">{button.id}</div>
                  {mapping && (
                    <div className="text-xs mt-1 text-blue-200 opacity-80">
                      {mapping.register}.{mapping.bit}
                    </div>
                  )}
                  {isActive && (
                    <div className="text-xs mt-1 text-yellow-200 font-bold animate-pulse">
                      ACTIVE
                    </div>
                  )}
                </div>
              </Button>
            );
          })}
        </div>
      </div>

      {/* Emergency Stop Section */}
      <div className="p-4 rounded-xl bg-white shadow-sm">
        <div className="flex justify-center">
          <Button
            onClick={handleEmergencyStop}
            className="h-16 px-8 text-lg font-bold bg-red-600 hover:bg-red-700 active:bg-red-800 text-white border-4 border-red-300 transition-all duration-200 shadow-lg hover:shadow-xl active:scale-95 disabled:opacity-50"
            disabled={isLoading}
          >
            🚨 EMERGENCY STOP 🚨
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ManualMode;
