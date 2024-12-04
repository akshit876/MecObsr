/* eslint-disable consistent-return */
'use client';
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useSocket } from '@/SocketContext';

const ManualMode = () => {
  const [buttonStates, setButtonStates] = useState({});
  const socket = useSocket();
  const [isJogging, setIsJogging] = useState(false);

  useEffect(() => {
    // if (socket) {
    //   socket.on("button-state-update", (data) => {
    //     setButtonStates((prevStates) => ({ ...prevStates, ...data }));
    //   });
    // }

    return () => {
      if (socket) {
        socket.off('manual-run');
      }
    };
  }, [socket]);

  const handleButtonClick = (buttonId) => {
    if (socket) {
      const operations = {
        'D14020.0': 'position1Home',
        'D14020.1': 'position2Scanner',
        'D14020.2': 'position3Marking',
        'D14020.3': 'position4',
        'D14020.4': 'position5',
        'D14020.5': 'jogFwd',
        'D14020.6': 'jogRev',
        'D14020.7': 'scannerTrigger',
        'D14020.8': 'marking',
        'D14020.9': 'lightOn',
      };

      const operation = operations[buttonId] || buttonId;
      socket.emit('manual-run', operation);
    }

    // For JOG FWD and JOG REV, we'll simulate the "on till pressing" behavior
    if (buttonId === 'D14020.5' || buttonId === 'D14020.6') {
      setButtonStates((prevStates) => ({ ...prevStates, [buttonId]: true }));

      const timeoutId = setTimeout(() => {
        setButtonStates((prevStates) => ({ ...prevStates, [buttonId]: false }));
      }, 200);

      return () => clearTimeout(timeoutId);
    }
  };

  const startJog = (buttonId) => {
    setIsJogging(true);
    setButtonStates((prevStates) => ({ ...prevStates, [buttonId]: true }));
    if (socket) {
      const operation = buttonId === 'D14020.5' ? 'jogFwd' : 'jogRev';
      socket.emit('manual-run', operation);
    }
  };

  const stopJog = (buttonId) => {
    setIsJogging(false);
    setButtonStates((prevStates) => ({ ...prevStates, [buttonId]: false }));
    if (socket) {
      socket.emit('manual-run', 'stopJog');
    }
  };

  const buttons = [
    { id: 'D14020.0', label: 'POSITION 1 (HOME)' },
    { id: 'D14020.1', label: 'POSITION 2 (SCANNER)' },
    { id: 'D14020.2', label: 'POSITION 3 (MARKING)' },
    { id: 'D14020.3', label: 'POSITION 4' },
    { id: 'D14020.4', label: 'POSITION 5' },
    { id: 'D14020.5', label: 'JOG FWD' },
    { id: 'D14020.6', label: 'JOG REV' },
    { id: 'D14020.7', label: 'SCANNER TRIGGER' },
    { id: 'D14020.8', label: 'MARKING' },
    { id: 'D14020.9', label: 'LIGHT ON' },
  ];

  return (
    <Card className="w-full max-w-4xl bg-black text-white">
      <CardHeader>
        <CardTitle className="text-3xl font-bold text-center text-yellow-300">
          MANUAL MODE
        </CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-3 gap-4">
        {buttons.map((button) => {
          const isJogButton = button.id === 'D14020.5' || button.id === 'D14020.6';

          return (
            <Button
              key={button.id}
              className={`h-20 text-lg font-semibold ${
                buttonStates[button.id] ? 'bg-purple-600' : 'bg-purple-300'
              } text-black border-2 border-green-500 hover:bg-purple-400`}
              {...(isJogButton
                ? {
                    onMouseDown: () => startJog(button.id),
                    onMouseUp: () => stopJog(button.id),
                    onMouseLeave: () => stopJog(button.id),
                  }
                : {
                    onClick: () => handleButtonClick(button.id),
                  })}
            >
              {button.label}
              <div className="text-xs mt-1">{button.id}</div>
            </Button>
          );
        })}
      </CardContent>
    </Card>
  );
};

export default ManualMode;
