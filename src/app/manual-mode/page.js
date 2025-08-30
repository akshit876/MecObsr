/* eslint-disable consistent-return */
'use client';
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { toast } from 'react-toastify';
import { getPLCMapping } from '@/constants/plcMapping';
import { useSocket } from '@/SocketContext';
import {
  Home,
  FileText,
  QrCode,
  Scan,
  Zap,
  Lightbulb,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  Play,
  AlertTriangle,
  Settings,
  Power,
} from 'lucide-react';

const ManualMode = () => {
  const [activeJogEvents, setActiveJogEvents] = useState(new Set());
  const [isLoading, setIsLoading] = useState(false);
  const [cycleStatus, setCycleStatus] = useState({ isPaused: false, pauseReason: '' });
  const socket = useSocket();

  // Emit manual mode enter event when component mounts
  useEffect(() => {
    if (socket?.connected) {
      // When user navigates to manual mode
      socket.emit('manual_mode_enter', { reason: 'Manual control needed' });

      // Check cycle status
      socket.emit('get_cycle_status');

      console.log('Manual mode entered - cycle paused');
    } else {
      console.log('Socket not connected - cannot emit manual_mode_enter event');
    }

    // Set up cycle status listener
    const handleCycleStatus = (status) => {
      setCycleStatus(status);
      if (status.isPaused) {
        console.log('Cycle paused:', status.pauseReason);
        toast.info(`Cycle paused: ${status.pauseReason}`, {
          position: 'top-center',
          autoClose: 3000,
        });
      } else {
        console.log('Cycle status:', status);
      }
    };

    if (socket) {
      socket.on('cycle_status_response', handleCycleStatus);
    }

    // Cleanup function - emit exit event and remove listeners when component unmounts
    return () => {
      if (socket?.connected) {
        // When user returns to dashboard
        socket.emit('manual_mode_exit');
        console.log('Manual mode exited - cycle can resume');
      }

      if (socket) {
        socket.off('cycle_status_response', handleCycleStatus);
      }
    };
  }, [socket]);

  // Manual exit function
  const handleManualExit = () => {
    if (socket?.connected) {
      socket.emit('manual_mode_exit');
      toast.info('Exiting manual mode - cycle can resume', {
        position: 'top-center',
        autoClose: 2000,
      });
      console.log('Manual mode exited manually - cycle can resume');
    }
  };

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
      const eventData = {
        type: buttonId,
        register: mapping.register,
        bit: mapping.bit,
        description: mapping.description,
      };

      console.log('Emitting manual control event to backend:', eventData);

      // Emit manual control event to backend
      socket.emit('manual_control', eventData);

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
      // Check if jog is already active to prevent multiple toasts
      if (activeJogEvents.has(jogType)) {
        console.log(`${jogType} already active, skipping duplicate start`);
        return;
      }

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

      // Emit jog start event to backend
      socket.emit('jog_control', eventData);

      // Set as active and show success toast only once
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
      // Check if jog is already stopped to prevent multiple toasts
      if (!activeJogEvents.has(jogType)) {
        console.log(`${jogType} already stopped, skipping duplicate stop`);
        return;
      }

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

      // Emit jog stop event to backend
      socket.emit('jog_control', eventData);

      // Remove from active and show success toast only once
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

        // Emit emergency stop event to backend
        socket.emit('emergency_stop');

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
    {
      id: 'HOME',
      label: 'HOME',
      icon: Home,
      color: 'blue',
      description: 'Return to home position',
    },
    { id: 'LOGO', label: 'LOGO', icon: FileText, color: 'green', description: 'Logo operation' },
    { id: 'CODE', label: 'CODE', icon: QrCode, color: 'purple', description: 'Code generation' },
    {
      id: 'CASTING_TRACEABILITY',
      label: 'CASTING TRACEABILITY',
      icon: Scan,
      color: 'indigo',
      description: 'Casting traceability',
    },
    {
      id: 'HUMAN_READABLE',
      label: 'HUMAN READABLE',
      icon: FileText,
      color: 'teal',
      description: 'Human readable format',
    },
    {
      id: 'SCANNER',
      label: 'SCANNER',
      icon: Scan,
      color: 'cyan',
      description: 'Scanner operation',
    },
    {
      id: 'SCANNER_TRIGGER',
      label: 'SCANNER TRIGGER',
      icon: Zap,
      color: 'orange',
      description: 'Trigger scanner',
    },
    { id: 'MARKON', label: 'MARKON', icon: Power, color: 'red', description: 'Activate marking' },
    { id: 'LIGHT', label: 'LIGHT', icon: Lightbulb, color: 'yellow', description: 'Light control' },
  ];

  const jogButtons = [
    {
      id: 'X_JOG_PLUS',
      label: 'X JOG+',
      icon: ArrowRight,
      color: 'blue',
      description: 'X-axis forward',
    },
    {
      id: 'X_JOG_MINUS',
      label: 'X JOG-',
      icon: ArrowLeft,
      color: 'blue',
      description: 'X-axis backward',
    },
    {
      id: 'Z_JOG_PLUS',
      label: 'Z JOG+',
      icon: ArrowUp,
      color: 'green',
      description: 'Z-axis forward',
    },
    {
      id: 'Z_JOG_MINUS',
      label: 'Z JOG-',
      icon: ArrowDown,
      color: 'green',
      description: 'Z-axis backward',
    },
  ];

  const getIconColor = (color) => {
    const colors = {
      blue: 'text-blue-500',
      green: 'text-green-500',
      purple: 'text-purple-500',
      indigo: 'text-indigo-500',
      teal: 'text-teal-500',
      cyan: 'text-cyan-500',
      orange: 'text-orange-500',
      red: 'text-red-500',
      yellow: 'text-yellow-500',
    };
    return colors[color] || 'text-gray-500';
  };

  const getBgColor = (color) => {
    const colors = {
      blue: 'bg-blue-50 border-blue-200 hover:bg-blue-100',
      green: 'bg-green-50 border-green-200 hover:bg-green-100',
      purple: 'bg-purple-50 border-purple-200 hover:bg-purple-100',
      indigo: 'bg-indigo-50 border-indigo-200 hover:bg-indigo-100',
      teal: 'bg-teal-50 border-teal-200 hover:bg-teal-100',
      cyan: 'bg-cyan-50 border-cyan-200 hover:bg-cyan-100',
      orange: 'bg-orange-50 border-orange-200 hover:bg-orange-100',
      red: 'bg-red-50 border-red-200 hover:bg-red-100',
      yellow: 'bg-yellow-50 border-yellow-200 hover:bg-yellow-100',
    };
    return colors[color] || 'bg-gray-50 border-gray-200 hover:bg-gray-100';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Header Section */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
                  <Settings className="w-6 h-6 text-white" />
                </div>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Manual Mode Controls</h1>
                <p className="text-sm text-gray-500">Professional machine operation interface</p>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              {/* Cycle Status Indicator */}
              <div className="flex items-center space-x-3 px-4 py-2 bg-gray-50 rounded-lg border">
                <div
                  className={`w-3 h-3 rounded-full ${cycleStatus.isPaused ? 'bg-yellow-400' : 'bg-green-400'}`}
                ></div>
                <span className="text-sm font-medium text-gray-700">
                  {cycleStatus.isPaused ? 'PAUSED' : 'RUNNING'}
                </span>
                {cycleStatus.isPaused && cycleStatus.pauseReason && (
                  <span className="text-xs text-gray-500">({cycleStatus.pauseReason})</span>
                )}
              </div>

              <Button
                onClick={handleManualExit}
                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-6 py-2 rounded-lg font-medium shadow-lg hover:shadow-xl transition-all duration-200"
                disabled={isLoading}
              >
                Exit Manual Mode
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Debug PLC Mappings */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6 mb-8">
          <h3 className="text-lg font-bold text-yellow-800 mb-4">🔍 Debug: PLC Mappings</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div className="bg-white p-3 rounded border">
              <div className="font-bold">HOME</div>
              <div className="font-mono text-blue-600">
                {getPLCMapping('HOME')?.register}.{getPLCMapping('HOME')?.bit}
              </div>
              <div className="text-xs text-gray-500">Expected: 1900.0</div>
            </div>
            <div className="bg-white p-3 rounded border">
              <div className="font-bold">LOGO</div>
              <div className="font-mono text-blue-600">
                {getPLCMapping('LOGO')?.register}.{getPLCMapping('LOGO')?.bit}
              </div>
              <div className="text-xs text-gray-500">Expected: 1900.1</div>
            </div>
            <div className="bg-white p-3 rounded border">
              <div className="font-bold">X_JOG_PLUS</div>
              <div className="font-mono text-blue-600">
                {getPLCMapping('X_JOG_PLUS')?.register}.{getPLCMapping('X_JOG_PLUS')?.bit}
              </div>
              <div className="text-xs text-gray-500">Expected: 1901.0</div>
            </div>
            <div className="bg-white p-3 rounded border">
              <div className="font-bold">Z_JOG_PLUS</div>
              <div className="font-mono text-blue-600">
                {getPLCMapping('Z_JOG_PLUS')?.register}.{getPLCMapping('Z_JOG_PLUS')?.bit}
              </div>
              <div className="text-xs text-gray-500">Expected: 1901.2</div>
            </div>
          </div>
          <div className="mt-4 p-4 bg-white rounded border">
            <div className="font-bold text-red-600 mb-2">Raw Function Test:</div>
            <div className="text-sm">
              <div>
                <strong>getPLCMapping(&apos;HOME&apos;):</strong>{' '}
                {JSON.stringify(getPLCMapping('HOME'))}
              </div>
              <div>
                <strong>getPLCMapping(&apos;LOGO&apos;):</strong>{' '}
                {JSON.stringify(getPLCMapping('LOGO'))}
              </div>
              <div>
                <strong>getPLCMapping(&apos;X_JOG_PLUS&apos;):</strong>{' '}
                {JSON.stringify(getPLCMapping('X_JOG_PLUS'))}
              </div>
            </div>
          </div>

          <div className="mt-4 text-xs text-yellow-700">
            <strong>Note:</strong> This debug section shows what the getPLCMapping function is
            actually returning vs what we expect.
          </div>
        </div>

        {/* Status Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* System Status */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">System Status</p>
                <p className="text-2xl font-bold text-gray-900">
                  {isLoading ? '🔄 Processing' : '✅ Ready'}
                </p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <Power className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>

          {/* Active Operations */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Operations</p>
                <p className="text-2xl font-bold text-gray-900">{activeJogEvents.size}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Play className="w-6 h-6 text-blue-600" />
              </div>
            </div>
            {activeJogEvents.size > 0 && (
              <div className="mt-2 text-xs text-blue-600 font-medium">
                {Array.from(activeJogEvents).join(', ')}
              </div>
            )}
          </div>

          {/* PLC Connection */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">PLC Connection</p>
                <p className="text-2xl font-bold text-gray-900">
                  {socket?.connected ? '🟢 Connected' : '🔴 Disconnected'}
                </p>
              </div>
              <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center">
                <Settings className="w-6 h-6 text-indigo-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Main Control Operations */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900">Main Control Operations</h2>
            <div className="text-sm text-gray-500">PLC-controlled machine operations</div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-3 gap-6">
            {buttons.map((button) => {
              const mapping = getPLCMapping(button.id);
              const IconComponent = button.icon;

              // Debug: Log what we're getting
              console.log(`Button ${button.id}:`, {
                mapping,
                register: mapping?.register,
                bit: mapping?.bit,
                expected:
                  button.id === 'HOME' ? '1900.0' : button.id === 'LOGO' ? '1900.1' : 'Unknown',
              });

              return (
                <div
                  key={button.id}
                  className={`group relative p-6 rounded-xl border-2 transition-all duration-200 cursor-pointer ${getBgColor(button.color)} hover:shadow-lg hover:scale-105`}
                  onClick={() => handleButtonClick(button.id)}
                >
                  <div className="flex items-center space-x-4">
                    <div
                      className={`w-12 h-12 bg-white rounded-lg flex items-center justify-center shadow-sm ${getIconColor(button.color)}`}
                    >
                      <IconComponent className="w-6 h-6" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 group-hover:text-gray-700">
                        {button.label}
                      </h3>
                      <p className="text-sm text-gray-600">{button.description}</p>
                      {mapping && (
                        <div className="mt-2 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                          <span className="mr-1">PLC:</span>
                          <span className="font-mono">
                            {mapping.register}.{mapping.bit}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Hover effect overlay */}
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent to-white opacity-0 group-hover:opacity-10 rounded-xl transition-opacity duration-200"></div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Jog Controls Section */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 mb-8">
          <div className="text-center mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-2">Precision Jog Controls</h2>
            <p className="text-gray-600">Press and hold for continuous movement, release to stop</p>
          </div>

          <div className="max-w-2xl mx-auto">
            <div className="grid grid-cols-2 gap-6">
              {jogButtons.map((button) => {
                const isActive = activeJogEvents.has(button.id);
                const mapping = getPLCMapping(button.id);
                const IconComponent = button.icon;

                return (
                  <div
                    key={button.id}
                    className={`relative p-6 rounded-xl border-2 transition-all duration-200 ${
                      isActive
                        ? 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-lg scale-105'
                        : 'bg-white border-gray-200 hover:border-blue-300 hover:shadow-md'
                    }`}
                    onMouseDown={() => handleJogStart(button.id)}
                    onMouseUp={() => handleJogStop(button.id)}
                    onTouchStart={() => handleJogStart(button.id)}
                    onTouchEnd={() => handleJogStop(button.id)}
                  >
                    <div className="text-center">
                      <div
                        className={`w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center ${
                          isActive
                            ? 'bg-white/20 ring-4 ring-white/30'
                            : 'bg-gray-100 group-hover:bg-blue-100'
                        }`}
                      >
                        <IconComponent
                          className={`w-8 h-8 ${isActive ? 'text-white' : 'text-gray-600'}`}
                        />
                      </div>

                      <h3
                        className={`text-lg font-bold mb-2 ${isActive ? 'text-white' : 'text-gray-900'}`}
                      >
                        {button.label}
                      </h3>

                      <p className={`text-sm mb-3 ${isActive ? 'text-white/80' : 'text-gray-600'}`}>
                        {button.description}
                      </p>

                      {mapping && (
                        <div
                          className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                            isActive ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          <span className="mr-1">PLC:</span>
                          <span className="font-mono">
                            {mapping.register}.{mapping.bit}
                          </span>
                        </div>
                      )}

                      {isActive && (
                        <div className="mt-3 inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-yellow-400 text-yellow-900 animate-pulse">
                          🟡 ACTIVE
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Emergency Stop Section */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
          <div className="text-center">
            <div className="w-20 h-20 mx-auto mb-6 bg-red-100 rounded-full flex items-center justify-center">
              <AlertTriangle className="w-10 h-10 text-red-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Emergency Stop</h2>
            <p className="text-gray-600 mb-6">
              Immediately stop all active operations and halt the system
            </p>

            <Button
              onClick={handleEmergencyStop}
              className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white px-8 py-4 text-lg font-bold rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 border-4 border-red-300"
              disabled={isLoading}
            >
              🚨 EMERGENCY STOP 🚨
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ManualMode;
