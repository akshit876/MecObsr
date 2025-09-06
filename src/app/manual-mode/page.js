'use client';
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useSocket } from '@/SocketContext';
import { useAlarmManager } from '@/hooks/useAlarmManager';
import ManualModeAlarmTest from '@/components/ManualModeAlarmTest';

const ManualMode = () => {
  const [buttonStates, setButtonStates] = useState({});
  const socket = useSocket();
  const { showAlarm } = useAlarmManager();

  useEffect(() => {
    if (!socket) return;

    // Socket event handlers for different alarm types
    const handleSafetyViolation = (data) => {
      console.log('Safety violation detected in manual mode:', data);
      showAlarm('safety-violation', `Safety Violation: ${data.violation || data.message}`, 'high');
    };

    const handleEmergencyStop = (data) => {
      console.log('Emergency stop detected in manual mode:', data);
      showAlarm(
        'emergency-stop',
        `Emergency Stop: ${data.message || 'System emergency stop activated'}`,
        'high',
      );
    };

    const handleMachineError = (data) => {
      console.log('Machine error detected in manual mode:', data);
      showAlarm('machine-error', `Machine Error: ${data.message || data.error}`, 'normal');
    };

    const handleOperationSuccess = (data) => {
      console.log('Operation success in manual mode:', data);
      showAlarm(
        'operation-success',
        `Success: ${data.message || 'Operation completed successfully'}`,
        'normal',
      );
    };

    const handlePartPresence = (data) => {
      console.log('Part presence issue in manual mode:', data);
      showAlarm('part-presence', `Part Issue: ${data.message || 'Part not detected'}`, 'normal');
    };

    const handleLightCurtain = (data) => {
      console.log('Light curtain issue in manual mode:', data);
      showAlarm(
        'light-curtain',
        `Light Curtain: ${data.message || 'Light curtain interrupted'}`,
        'normal',
      );
    };

    // Register all socket event handlers
    socket.on('safety_violation', handleSafetyViolation);
    socket.on('emergency_stop', handleEmergencyStop);
    socket.on('machine_error', handleMachineError);
    socket.on('operation_success', handleOperationSuccess);
    socket.on('part_presence', handlePartPresence);
    socket.on('light_curtain', handleLightCurtain);
    socket.on('error', handleMachineError);

    // Optional: Button state updates
    // socket.on("button-state-update", (data) => {
    //   setButtonStates((prevStates) => ({ ...prevStates, ...data }));
    // });

    return () => {
      // Cleanup all event listeners
      socket.off('safety_violation', handleSafetyViolation);
      socket.off('emergency_stop', handleEmergencyStop);
      socket.off('machine_error', handleMachineError);
      socket.off('operation_success', handleOperationSuccess);
      socket.off('part_presence', handlePartPresence);
      socket.off('light_curtain', handleLightCurtain);
      socket.off('error', handleMachineError);
      socket.off('manual-run');
    };
  }, [socket, showAlarm]);

  const handleButtonClick = (buttonId) => {
    if (socket) {
      const operations = {
        'D1414.B0': 'markingStart',
        'D1414.B1': 'scannerTrigger',
        'D1414.B2': 'ocrTrigger',
        'D1414.B3': 'workLight',
        'D1414.B4': 'servoHomeposition',
        'D1414.B5': 'servoscannerposition',
        'D1414.B6': 'servoocrposition',
        'D1414.B7': 'servomarkposition',
        'D1414.B8': 'jogFwd',
        'D1414.B9': 'jogRev',
      };

      const operation = operations[buttonId] || buttonId; // Get the operation based on buttonId

      // Show operation start alarm
      const buttonLabels = {
        'D1414.B0': 'Marking Start',
        'D1414.B1': 'Scanner Trigger',
        'D1414.B2': 'OCR Trigger',
        'D1414.B3': 'Work Light',
        'D1414.B4': 'Servo Home Position',
        'D1414.B5': 'Scanner Position',
        'D1414.B6': 'OCR Position',
        'D1414.B7': 'Marking Position',
        'D1414.B8': 'Jog Forward',
        'D1414.B9': 'Jog Reverse',
      };

      const buttonLabel = buttonLabels[buttonId] || buttonId;
      showAlarm('operation-success', `Starting: ${buttonLabel}`, 'normal');

      socket.emit('manual-run', operation);
    }

    // For JOG FWD and JOG REV, we'll simulate the "on till pressing" behavior
    if (buttonId === 'D1414.B8' || buttonId === 'D1414.B9') {
      setButtonStates((prevStates) => ({ ...prevStates, [buttonId]: true }));

      const timeoutId = setTimeout(() => {
        setButtonStates((prevStates) => ({ ...prevStates, [buttonId]: false }));
        // Show completion alarm for jog operations
        const buttonLabels = {
          'D1414.B8': 'Jog Forward',
          'D1414.B9': 'Jog Reverse',
        };
        const buttonLabel = buttonLabels[buttonId];
        showAlarm('operation-success', `Completed: ${buttonLabel}`, 'normal');
      }, 200); // 200ms to simulate "200 miles per second"

      return () => clearTimeout(timeoutId);
    }
  };

  const buttons = [
    { id: 'D1414.B4', label: 'HOME POSITION' },
    { id: 'D1414.B2', label: 'OCR TRIGGER' },
    { id: 'D1414.B5', label: 'SCANNER POSITION' },
    { id: 'D1414.B0', label: 'MARKING START' },
    { id: 'D1414.B6', label: 'OCR POSITION' },
    { id: 'D1414.B1', label: 'SCANNER TRIGGER' },
    { id: 'D1414.B7', label: 'MARKING POSITION' },
    { id: 'D1414.B3', label: 'LIGHT' },
    { id: 'D1414.B8', label: 'JOG FWD' },
    { id: 'D1414.B9', label: 'JOG REV' },
  ];

  return (
    <div className="space-y-6 p-4">
      {/* Alarm Test Component - Remove this in production */}
      <ManualModeAlarmTest />

      <Card className="w-full max-w-4xl bg-black text-white">
        <CardHeader>
          <CardTitle className="text-3xl font-bold text-center text-yellow-300">
            MANUAL MODE
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-3 gap-4">
          {buttons.map((button) => (
            <Button
              key={button.id}
              className={`h-20 text-lg font-semibold ${
                buttonStates[button.id] ? 'bg-purple-600' : 'bg-purple-300'
              } text-black border-2 border-green-500 hover:bg-purple-400`}
              onMouseDown={() => handleButtonClick(button.id)}
              onMouseUp={() => {
                if (button.id === 'D1414.B8' || button.id === 'D1414.B9') {
                  setButtonStates((prevStates) => ({
                    ...prevStates,
                    [button.id]: false,
                  }));
                }
              }}
            >
              {button.label}
              <div className="text-xs mt-1">{button.id}</div>
            </Button>
          ))}
        </CardContent>
      </Card>
    </div>
  );
};

export default ManualMode;
