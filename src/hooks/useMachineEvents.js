import { useEffect } from 'react';
import { useAlarmManager } from './useAlarmManager';

export const useMachineEvents = (socket) => {
  const { showAlarm, clearAlarmByKey } = useAlarmManager();

  useEffect(() => {
    if (!socket) return;

    const eventHandlers = {
      'part-presence': (data) => {
        showAlarm('part-presence', data.message || 'Part not present', 'normal');
      },
      'emergency-stop': (data) => {
        showAlarm('emergency-stop', data.message || 'Emergency button pressed', 'high');
      },
      'light-curtation': (data) => {
        showAlarm('light-curtain', data.message || 'Light curtain error', 'normal');
      },
      safety_violation: (data) => {
        // Backend sends: { violation, timestamp, cycleNumber, status: 'active' | 'cleared' }
        const violationMessage =
          data.violation || data.message || data.type || 'Unknown safety violation';
        const status = data.status || 'active';

        // Create unique key based on violation message to allow multiple different violations
        const violationKey = `safety_violation_${violationMessage}`;

        // If status is 'cleared', dismiss the alarm if it exists
        if (status === 'cleared') {
          clearAlarmByKey(violationKey);
          return;
        }

        // Only show alarm if status is 'active'
        if (status === 'active') {
          showAlarm('safety-violation', violationMessage, 'high', violationKey);
        }
      },
    };

    // Register all event handlers
    Object.entries(eventHandlers).forEach(([event, handler]) => {
      socket.on(event, handler);
    });

    // Cleanup function
    return () => {
      Object.keys(eventHandlers).forEach((event) => {
        socket.off(event);
      });
    };
  }, [socket, showAlarm, clearAlarmByKey]);
};
