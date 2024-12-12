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
  };

  const startJog = (buttonId) => {
    if (socket) {
      const operation = buttonId === 'D1418.8' ? 'jogFwd' : 'jogRev';
      socket.emit('manual-run', operation);
      const intervalId = setInterval(() => {
        socket.emit('manual-run', operation);
      }, 1);
      return intervalId;
    }
  };

  const stopJog = (intervalId) => {
    if (intervalId) {
      clearInterval(intervalId);
    }
    if (socket) {
      // socket.emit('manual-run', 'stopJog');
    }
  };

  return (
    <Card className="w-full h-screen p-4 bg-slate-50">
      <CardHeader className="p-4 rounded-xl bg-[#012B41] text-white shadow-sm mb-4">
        <CardTitle className="text-xl font-semibold">
          Manual Mode Controls
        </CardTitle>
      </CardHeader>
      <CardContent className="flex gap-8">
        {/* Column 1 - Position Buttons */}
        <div className="flex flex-col gap-4 flex-1">
          <h3 className="font-semibold text-center mb-2">Position Controls</h3>
          <Button
            className="h-20 text-sm font-medium rounded-lg shadow-sm bg-[#012B41] hover:bg-[#023855] text-white"
            onClick={() => handleButtonClick('D1420.0')}
          >
            POSITION 1 (HOME)
            <div className="text-xs mt-1 text-gray-300">D1420.0</div>
          </Button>
          <Button
            className="h-20 text-sm font-medium rounded-lg shadow-sm bg-[#012B41] hover:bg-[#023855] text-white"
            onClick={() => handleButtonClick('D1420.1')}
          >
            POSITION 2 (SCANNER)
            <div className="text-xs mt-1 text-gray-300">D1420.1</div>
          </Button>
          <Button
            className="h-20 text-sm font-medium rounded-lg shadow-sm bg-[#012B41] hover:bg-[#023855] text-white"
            onClick={() => handleButtonClick('D1420.2')}
          >
            POSITION 3 (MARKING)
            <div className="text-xs mt-1 text-gray-300">D1420.2</div>
          </Button>
          <Button
            className="h-20 text-sm font-medium rounded-lg shadow-sm bg-[#012B41] hover:bg-[#023855] text-white"
            onClick={() => handleButtonClick('D1420.3')}
          >
            POSITION 4
            <div className="text-xs mt-1 text-gray-300">D1420.3</div>
          </Button>
          <Button
            className="h-20 text-sm font-medium rounded-lg shadow-sm bg-[#012B41] hover:bg-[#023855] text-white"
            onClick={() => handleButtonClick('D1420.4')}
          >
            POSITION 5
            <div className="text-xs mt-1 text-gray-300">D1420.4</div>
          </Button>
        </div>

        {/* Column 2 - Jog Buttons */}
        <div className="flex flex-col gap-4 flex-1">
          <h3 className="font-semibold text-center mb-2">Jog Controls</h3>
          <Button
            className="h-20 text-sm font-medium rounded-lg shadow-sm bg-[#012B41] hover:bg-[#023855] text-white"
            onMouseDown={(e) => {
              const intervalId = startJog('D1418.8');
              e.currentTarget._intervalId = intervalId;
            }}
            onMouseUp={(e) => stopJog(e.currentTarget._intervalId)}
            onMouseLeave={(e) => stopJog(e.currentTarget._intervalId)}
          >
            JOG FWD
            <div className="text-xs mt-1 text-gray-300">D1418.8</div>
          </Button>
          <Button
            className="h-20 text-sm font-medium rounded-lg shadow-sm bg-[#012B41] hover:bg-[#023855] text-white"
            onMouseDown={(e) => {
              const intervalId = startJog('D1418.9');
              e.currentTarget._intervalId = intervalId;
            }}
            onMouseUp={(e) => stopJog(e.currentTarget._intervalId)}
            onMouseLeave={(e) => stopJog(e.currentTarget._intervalId)}
          >
            JOG REV
            <div className="text-xs mt-1 text-gray-300">D1418.9</div>
          </Button>
        </div>

        {/* Column 3 - Action Buttons */}
        <div className="flex flex-col gap-4 flex-1">
          <h3 className="font-semibold text-center mb-2">Action Controls</h3>
          <Button
            className="h-20 text-sm font-medium rounded-lg shadow-sm bg-[#012B41] hover:bg-[#023855] text-white"
            onClick={() => handleButtonClick('D1414.1')}
          >
            SCANNER TRIGGER
            <div className="text-xs mt-1 text-gray-300">D1414.1</div>
          </Button>
          <Button
            className="h-20 text-sm font-medium rounded-lg shadow-sm bg-[#012B41] hover:bg-[#023855] text-white"
            onClick={() => handleButtonClick('D1414.0')}
          >
            MARK ON
            <div className="text-xs mt-1 text-gray-300">D1414.0</div>
          </Button>
          <Button
            className="h-20 text-sm font-medium rounded-lg shadow-sm bg-[#012B41] hover:bg-[#023855] text-white"
            onClick={() => handleButtonClick('D1414.3')}
          >
            LIGHT ON
            <div className="text-xs mt-1 text-gray-300">D1414.3</div>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default ManualMode;
