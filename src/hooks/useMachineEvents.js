import { useEffect } from 'react';
import { useAlarmManager } from './useAlarmManager';

export const useMachineEvents = (socket) => {
  const { showAlarm } = useAlarmManager();

  useEffect(() => {
    if (!socket) return;

    const eventHandlers = {
      'part-presence': (data) => {
        showAlarm('part-presence', data.message || "Part not present", 'normal');
      },
      'emergency-stop': (data) => {
        showAlarm('emergency-stop', data.message || "Emergency button pressed", 'high');
      },
      'light-curtation': (data) => {
        showAlarm('light-curtain', data.message || "Light curtain error", 'normal');
      }
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
  }, [socket]);
}; 