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
      label: 'Z-JOG+ DOWN',
      icon: ArrowUp,
      color: 'green',
      description: 'Z-axis forward',
    },
    {
      id: 'Z_JOG_MINUS',
      label: 'Z-JOG- UP',
      icon: ArrowDown,
      color: 'green',
      description: 'Z-axis backward',
    },
  ];

  const getIconColor = (color) => {
    const colors = {
      blue: 'text-blue-400',
      green: 'text-green-400',
      purple: 'text-purple-400',
      indigo: 'text-indigo-400',
      teal: 'text-teal-400',
      cyan: 'text-cyan-400',
      orange: 'text-orange-400',
      red: 'text-red-400',
      yellow: 'text-yellow-400',
    };
    return colors[color] || 'text-gray-400';
  };

  const getBgColor = (color) => {
    const colors = {
      blue: 'bg-blue-900/20 border-blue-700/50 hover:bg-blue-900/30 dark:bg-blue-900/30 dark:border-blue-600/50 dark:hover:bg-blue-900/40',
      green:
        'bg-green-900/20 border-green-700/50 hover:bg-green-900/30 dark:bg-green-900/30 dark:border-green-600/50 dark:hover:bg-green-900/40',
      purple:
        'bg-purple-900/20 border-purple-700/50 hover:bg-purple-900/30 dark:bg-purple-900/30 dark:border-purple-600/50 dark:hover:bg-purple-900/40',
      indigo:
        'bg-indigo-900/20 border-indigo-700/50 hover:bg-indigo-900/30 dark:bg-indigo-900/30 dark:border-indigo-600/50 dark:hover:bg-indigo-900/40',
      teal: 'bg-teal-900/20 border-teal-700/50 hover:bg-teal-900/30 dark:bg-teal-900/30 dark:border-teal-600/50 dark:hover:bg-teal-900/40',
      cyan: 'bg-cyan-900/20 border-cyan-700/50 hover:bg-cyan-900/30 dark:bg-cyan-900/30 dark:border-cyan-600/50 dark:hover:bg-cyan-900/40',
      orange:
        'bg-orange-900/20 border-orange-700/50 hover:bg-orange-900/30 dark:bg-orange-900/30 dark:border-orange-600/50 dark:hover:bg-orange-900/40',
      red: 'bg-red-900/20 border-red-700/50 hover:bg-red-900/30 dark:bg-red-900/30 dark:border-red-600/50 dark:hover:bg-red-900/40',
      yellow:
        'bg-yellow-900/20 border-yellow-700/50 hover:bg-yellow-900/30 dark:bg-yellow-900/30 dark:border-yellow-600/50 dark:hover:bg-yellow-900/40',
    };
    return (
      colors[color] ||
      'bg-gray-900/20 border-gray-700/50 hover:bg-gray-900/30 dark:bg-gray-900/30 dark:border-gray-600/50 dark:hover:bg-gray-900/40'
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-gray-900 to-slate-800 dark:from-slate-900 dark:via-gray-900 dark:to-slate-800">
      {/* Header Section */}
      <div className="bg-gray-800/90 border-b border-gray-700 shadow-sm backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-lg flex items-center justify-center shadow-lg">
                  <Settings className="w-6 h-6 text-white" />
                </div>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">Manual Mode Controls</h1>
                <p className="text-sm text-gray-300">Professional machine operation interface</p>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              {/* Cycle Status Indicator */}
              <div className="flex items-center space-x-3 px-4 py-2 bg-gray-700/50 rounded-lg border border-gray-600 backdrop-blur-sm">
                <div
                  className={`w-3 h-3 rounded-full ${cycleStatus.isPaused ? 'bg-yellow-400' : 'bg-green-400'}`}
                ></div>
                <span className="text-sm font-medium text-gray-200">
                  {cycleStatus.isPaused ? 'PAUSED' : 'RUNNING'}
                </span>
                {cycleStatus.isPaused && cycleStatus.pauseReason && (
                  <span className="text-xs text-gray-400">({cycleStatus.pauseReason})</span>
                )}
              </div>

              <Button
                onClick={handleManualExit}
                className="bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white px-6 py-2 rounded-lg font-medium shadow-lg hover:shadow-xl transition-all duration-200 border border-blue-400/20"
                disabled={isLoading}
              >
                Exit Manual Mode
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Status Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* System Status */}
          <div className="bg-gray-800/50 rounded-xl shadow-sm border border-gray-700 p-6 backdrop-blur-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-300">System Status</p>
                <p className="text-2xl font-bold text-white">
                  {isLoading ? '🔄 Processing' : '✅ Ready'}
                </p>
              </div>
              <div className="w-12 h-12 bg-green-900/30 rounded-lg flex items-center justify-center border border-green-700/50">
                <Power className="w-6 h-6 text-green-400" />
              </div>
            </div>
          </div>

          {/* Active Operations */}
          <div className="bg-gray-800/50 rounded-xl shadow-sm border border-gray-700 p-6 backdrop-blur-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-300">Active Operations</p>
                <p className="text-2xl font-bold text-white">{activeJogEvents.size}</p>
              </div>
              <div className="w-12 h-12 bg-blue-900/30 rounded-lg flex items-center justify-center border border-blue-700/50">
                <Play className="w-6 h-6 text-blue-400" />
              </div>
            </div>
            {activeJogEvents.size > 0 && (
              <div className="mt-2 text-xs text-blue-400 font-medium">
                {Array.from(activeJogEvents).join(', ')}
              </div>
            )}
          </div>

          {/* PLC Connection */}
          <div className="bg-gray-800/50 rounded-xl shadow-sm border border-gray-700 p-6 backdrop-blur-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-300">PLC Connection</p>
                <p className="text-2xl font-bold text-white">
                  {socket?.connected ? '🟢 Connected' : '🔴 Disconnected'}
                </p>
              </div>
              <div className="w-12 h-12 bg-indigo-900/30 rounded-lg flex items-center justify-center border border-indigo-700/50">
                <Settings className="w-6 h-6 text-indigo-400" />
              </div>
            </div>
          </div>
        </div>

        {/* Main Control Operations */}
        <div className="bg-gray-800/50 rounded-xl shadow-sm border border-gray-700 p-8 mb-8 backdrop-blur-sm">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-white">Main Control Operations</h2>
            <div className="text-sm text-gray-300">PLC-controlled machine operations</div>
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
                  button.id === 'HOME'
                    ? '1480.0'
                    : button.id === 'LOGO'
                      ? '1481.0'
                      : button.id === 'CODE'
                        ? '1482.0'
                        : 'Unknown',
              });

              return (
                <div
                  key={button.id}
                  className={`group relative p-6 rounded-xl border-2 transition-all duration-200 cursor-pointer ${getBgColor(button.color)} hover:shadow-lg hover:scale-105`}
                  onClick={() => handleButtonClick(button.id)}
                >
                  <div className="flex items-center space-x-4">
                    <div
                      className={`w-12 h-12 bg-gray-700/50 rounded-lg flex items-center justify-center shadow-sm border border-gray-600/50 ${getIconColor(button.color)}`}
                    >
                      <IconComponent className="w-6 h-6" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-white group-hover:text-gray-200">
                        {button.label}
                      </h3>
                      <p className="text-sm text-gray-300">{button.description}</p>
                      {mapping && (
                        <div className="mt-2 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-700/50 text-gray-200 border border-gray-600/50">
                          <span className="mr-1">PLC:</span>
                          <span className="font-mono">
                            {mapping.register}.{mapping.bit}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Hover effect overlay */}
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent to-white opacity-0 group-hover:opacity-5 rounded-xl transition-opacity duration-200"></div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Jog Controls Section */}
        <div className="bg-gray-800/50 rounded-xl shadow-sm border border-gray-700 p-8 mb-8 backdrop-blur-sm">
          <div className="text-center mb-8">
            <h2 className="text-xl font-bold text-white mb-2">Precision Jog Controls</h2>
            <p className="text-gray-300">Press and hold for continuous movement, release to stop</p>
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
                        : 'bg-gray-700/50 border-gray-600 hover:border-blue-400/50 hover:shadow-md backdrop-blur-sm'
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
                            : 'bg-gray-600/50 group-hover:bg-blue-600/30 border border-gray-500/50'
                        }`}
                      >
                        <IconComponent
                          className={`w-8 h-8 ${isActive ? 'text-white' : 'text-gray-300'}`}
                        />
                      </div>

                      <h3
                        className={`text-lg font-bold mb-2 ${isActive ? 'text-white' : 'text-white'}`}
                      >
                        {button.label}
                      </h3>

                      <p className={`text-sm mb-3 ${isActive ? 'text-white/80' : 'text-gray-300'}`}>
                        {button.description}
                      </p>

                      {mapping && (
                        <div
                          className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                            isActive
                              ? 'bg-white/20 text-white'
                              : 'bg-gray-600/50 text-gray-200 border border-gray-500/50'
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
        {/* <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
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
        </div> */}
      </div>
    </div>
  );
};

export default ManualMode;
