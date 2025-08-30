/* eslint-disable consistent-return */
'use client';
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { useSocket } from '@/SocketContext';
import { toast } from 'react-toastify';
import { getPLCMapping } from '@/constants/plcMapping';

const ManualMode = () => {
  const socket = useSocket();
  const [activeJogEvents, setActiveJogEvents] = useState(new Set());
  const [plcStatus, setPlcStatus] = useState({
    isConnected: false,
    totalActiveEvents: 0,
  });

  useEffect(() => {
    if (!socket) return;

    // Listen for PLC status updates
    const handlePLCStatusUpdate = (data) => {
      console.log('PLC Status Update:', data);

      if (data.type === 'jog_event_started') {
        setActiveJogEvents((prev) => new Set([...prev, data.eventName]));
        toast.info(`${data.eventName} started`, {
          position: 'top-right',
          autoClose: 1000,
        });
      } else if (data.type === 'jog_event_stopped') {
        setActiveJogEvents((prev) => {
          const newSet = new Set(prev);
          newSet.delete(data.eventName);
          return newSet;
        });
        toast.info(`${data.eventName} stopped (Duration: ${data.duration})`, {
          position: 'top-right',
          autoClose: 1000,
        });
      } else if (data.type === 'manual_event_started') {
        toast.success(`${data.eventName} activated`, {
          position: 'top-right',
          autoClose: 1000,
        });
      } else if (data.type === 'manual_event_completed') {
        toast.info(`${data.eventName} completed`, {
          position: 'top-right',
          autoClose: 1000,
        });
      } else if (data.type === 'emergency_stop') {
        setActiveJogEvents(new Set());
        toast.warning(
          `Emergency stop executed. Stopped ${data.stoppedEvents?.length || 0} events.`,
          {
            position: 'top-right',
            autoClose: 3000,
          },
        );
      } else if (data.type === 'status_request') {
        setPlcStatus({
          isConnected: data.isConnected,
          totalActiveEvents: data.totalActiveEvents,
        });
        setActiveJogEvents(new Set(data.activeJogEvents?.map((e) => e.eventName) || []));
      }
    };

    // Listen for manual control responses
    const handleManualControlResponse = (data) => {
      if (data.success) {
        console.log('Manual control success:', data);
      } else {
        toast.error(`Manual control failed: ${data.message}`, {
          position: 'top-right',
          autoClose: 3000,
        });
      }
    };

    // Listen for jog control responses
    const handleJogControlResponse = (data) => {
      if (data.success) {
        console.log('Jog control success:', data);
      } else {
        toast.error(`Jog control failed: ${data.message}`, {
          position: 'top-right',
          autoClose: 3000,
        });
      }
    };

    // Listen for emergency stop responses
    const handleEmergencyStopResponse = (data) => {
      if (data.success) {
        console.log('Emergency stop success:', data);
      } else {
        toast.error(`Emergency stop failed: ${data.message}`, {
          position: 'top-right',
          autoClose: 3000,
        });
      }
    };

    // Listen for errors
    const handleError = (data) => {
      toast.error(`Error: ${data.message}`, {
        position: 'top-right',
        autoClose: 3000,
      });
    };

    // Bind event listeners
    socket.on('plc_status_update', handlePLCStatusUpdate);
    socket.on('manual_control_response', handleManualControlResponse);
    socket.on('jog_control_response', handleJogControlResponse);
    socket.on('emergency_stop_response', handleEmergencyStopResponse);
    socket.on('error', handleError);

    // Get initial PLC status
    socket.emit('get_plc_status');

    // Cleanup
    return () => {
      socket.off('plc_status_update', handlePLCStatusUpdate);
      socket.off('manual_control_response', handleManualControlResponse);
      socket.off('jog_control_response', handleJogControlResponse);
      socket.off('emergency_stop_response', handleEmergencyStopResponse);
      socket.off('error', handleError);
    };
  }, [socket]);

  const handleButtonClick = (buttonId) => {
    if (socket) {
      // Get PLC mapping for this button
      const mapping = getPLCMapping(buttonId);
      if (!mapping) {
        toast.error(`Unknown button: ${buttonId}`);
        return;
      }

      // Emit manual control event with register and bit information
      socket.emit('manual_control', {
        type: buttonId,
        register: mapping.register,
        bit: mapping.bit,
        description: mapping.description,
      });
    }
  };

  const handleJogStart = (jogType) => {
    if (socket) {
      // Get PLC mapping for this jog control
      const mapping = getPLCMapping(jogType);
      if (!mapping) {
        toast.error(`Unknown jog control: ${jogType}`);
        return;
      }

      // Emit jog start event with register and bit information
      socket.emit('jog_control', {
        type: jogType,
        action: 'start',
        register: mapping.register,
        bit: mapping.bit,
        description: mapping.description,
      });
    }
  };

  const handleJogStop = (jogType) => {
    if (socket) {
      // Get PLC mapping for this jog control
      const mapping = getPLCMapping(jogType);
      if (!mapping) {
        toast.error(`Unknown jog control: ${jogType}`);
        return;
      }

      // Emit jog stop event with register and bit information
      socket.emit('jog_control', {
        type: jogType,
        action: 'stop',
        register: mapping.register,
        bit: mapping.bit,
        description: mapping.description,
      });
    }
  };

  const handleEmergencyStop = () => {
    if (socket) {
      if (
        window.confirm(
          'Are you sure you want to execute emergency stop? This will stop all active operations.',
        )
      ) {
        socket.emit('emergency_stop');
      }
    }
  };

  const handleRefreshStatus = () => {
    if (socket) {
      socket.emit('get_plc_status');
    }
  };

  const buttons = [
    { id: 'HMOE', label: 'HMOE', category: 'main' },
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
    <div className="h-screen w-full p-4 flex flex-col gap-3 bg-slate-50">
      {/* Header Card */}
      <div className="p-4 rounded-lg bg-[#012B41] text-white shadow-sm">
        <h1 className="text-2xl font-bold text-center">Manual Mode Controls</h1>
        <p className="text-sm text-gray-300 text-center mt-2">
          Professional control interface for machine operations
        </p>
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
                className="h-20 text-base font-semibold bg-[#012B41] hover:bg-[#023855] text-white border-2 border-gray-200 hover:border-gray-300 transition-all duration-200 shadow-sm hover:shadow-md"
                onClick={() => handleButtonClick(button.id)}
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
                } text-white border-2 border-white transition-all duration-200 shadow-sm hover:shadow-md active:scale-95`}
                onMouseDown={() => handleJogStart(button.id)}
                onMouseUp={() => handleJogStop(button.id)}
                onTouchStart={() => handleJogStart(button.id)}
                onTouchEnd={() => handleJogStop(button.id)}
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
            className="h-16 px-8 text-lg font-bold bg-red-600 hover:bg-red-700 active:bg-red-800 text-white border-4 border-red-300 transition-all duration-200 shadow-lg hover:shadow-xl active:scale-95"
          >
            🚨 EMERGENCY STOP 🚨
          </Button>
        </div>
      </div>

      {/* Status Information */}
      <div className="p-4 rounded-xl bg-white shadow-sm">
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-lg font-semibold text-gray-700">System Status</h3>
          <Button
            onClick={handleRefreshStatus}
            className="text-sm px-3 py-1 bg-blue-500 hover:bg-blue-600 text-white rounded"
          >
            🔄 Refresh
          </Button>
        </div>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="p-3 rounded-lg bg-green-50 border border-green-200">
            <div className="font-medium text-green-800">Connection Status</div>
            <div className="text-green-600">{socket?.connected ? 'Connected' : 'Disconnected'}</div>
          </div>
          <div className="p-3 rounded-lg bg-blue-50 border border-blue-200">
            <div className="font-medium text-blue-800">Control Mode</div>
            <div className="text-blue-600">Manual</div>
          </div>
          <div className="p-3 rounded-lg bg-yellow-50 border border-yellow-200">
            <div className="font-medium text-yellow-800">PLC Connection</div>
            <div className="text-yellow-600">
              {plcStatus.isConnected ? 'Connected' : 'Disconnected'}
            </div>
          </div>
          <div className="p-3 rounded-lg bg-purple-50 border border-purple-200">
            <div className="font-medium text-purple-800">Active Operations</div>
            <div className="text-purple-600">{plcStatus.totalActiveEvents}</div>
          </div>
        </div>
        {activeJogEvents.size > 0 && (
          <div className="mt-3 p-3 rounded-lg bg-orange-50 border border-orange-200">
            <div className="font-medium text-orange-800 mb-2">Active Jog Operations:</div>
            <div className="text-orange-600 text-sm">{Array.from(activeJogEvents).join(', ')}</div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ManualMode;
