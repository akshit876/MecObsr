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
        'D1420.0': 'position1Home',
        'D1420.1': 'position2Scanner',
        'D1420.2': 'position3Marking',
        'D1420.3': 'position4',
        'D1420.4': 'position5',
        'D1418.8': 'jogFwd',
        'D1418.9': 'jogRev',
        'D1414.1': 'scannerTrigger',
        'D1414.0': 'markOn',
        'D1414.3': 'lightOn',
      };

      const operation = operations[buttonId] || buttonId;
      socket.emit('manual-run', operation);
    }

    // For JOG FWD and JOG REV, we'll simulate the "on till pressing" behavior
    if (buttonId === 'D1418.8' || buttonId === 'D1418.9') {
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
      const operation = buttonId === 'D1418.8' ? 'jogFwd' : 'jogRev';
      socket.emit('manual-run', operation);
    }
  };

  const stopJog = (buttonId) => {
    setIsJogging(false);
    setButtonStates((prevStates) => ({ ...prevStates, [buttonId]: false }));
    if (socket) {
      // socket.emit('manual-run', 'stopJog');
    }
  };

  const buttons = [
    { id: 'D1420.0', label: 'POSITION 1 (HOME)' },
    { id: 'D1420.1', label: 'POSITION 2 (SCANNER)' },
    { id: 'D1420.2', label: 'POSITION 3 (MARKING)' },
    { id: 'D1420.3', label: 'POSITION 4' },
    { id: 'D1420.4', label: 'POSITION 5' },
    { id: 'D1418.8', label: 'JOG FWD' },
    { id: 'D1418.9', label: 'JOG REV' },
    { id: 'D1414.1', label: 'SCANNER TRIGGER' },
    { id: 'D1414.0', label: 'MARK ON' },
    { id: 'D1414.3', label: 'LIGHT ON' },
  ];

  return (
    <Card className="w-full h-screen p-4 bg-slate-50">
      <CardHeader className="p-4 rounded-xl bg-[#012B41] text-white shadow-sm mb-4">
        <CardTitle className="text-xl font-semibold">
          Manual Mode Controls
        </CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-3 gap-4">
        {buttons.map((button) => {
          const isJogButton = button.id === 'D1418.8' || button.id === 'D1418.9';

          return (
            <Button
              key={button.id}
              className={`h-20 text-sm font-medium rounded-lg shadow-sm
                ${buttonStates[button.id] 
                  ? 'bg-blue-500 text-white' 
                  : 'bg-[#012B41] hover:bg-[#023855] text-white'
                }`}
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
              <div className="text-xs mt-1 text-gray-300">{button.id}</div>
            </Button>
          );
        })}
      </CardContent>
    </Card>
  );
};

export default ManualMode;
