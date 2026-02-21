'use client';

import { useEffect, useState } from 'react';
import { useSocket } from '@/SocketContext';

const MAX_ALARMS = 50;

/**
 * Listens only to safety_violation from backend (PLC register 1490).
 * Payload: { timestamp, violation, cycleNumber }
 */
export function useSafetyAlarms() {
  const socket = useSocket();
  const [alarms, setAlarms] = useState([]);

  useEffect(() => {
    if (!socket) return;

    const handleSafetyViolation = (payload) => {
      const message = payload.violation ?? payload.message ?? 'Unknown safety violation';
      const id = `${payload.timestamp ?? Date.now()}-${message}-${Math.random().toString(36).slice(2, 9)}`;
      setAlarms((prev) => [
        { id, message, time: payload.timestamp, cycle: payload.cycleNumber },
        ...prev.slice(0, MAX_ALARMS - 1),
      ]);
    };

    socket.on('safety_violation', handleSafetyViolation);

    return () => {
      socket.off('safety_violation', handleSafetyViolation);
    };
  }, [socket]);

  return alarms;
}
