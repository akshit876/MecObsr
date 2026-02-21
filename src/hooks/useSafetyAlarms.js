'use client';

import { useEffect, useState } from 'react';
import { useSocket } from '@/SocketContext';

const MAX_ALARMS = 50;

/**
 * Listens to safety_violation (add) and safety_cleared (remove) from backend (PLC 1490).
 * safety_violation: { timestamp, violation, cycleNumber }
 * safety_cleared: { violation } – remove matching alarm from list
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

    const handleSafetyCleared = (payload) => {
      const violation = payload.violation ?? payload.message ?? null;
      if (!violation) return;
      setAlarms((prev) => prev.filter((a) => a.message !== violation));
    };

    socket.on('safety_violation', handleSafetyViolation);
    socket.on('safety_cleared', handleSafetyCleared);

    return () => {
      socket.off('safety_violation', handleSafetyViolation);
      socket.off('safety_cleared', handleSafetyCleared);
    };
  }, [socket]);

  return alarms;
}
