import { useEffect, useRef } from 'react';
import { toast } from 'react-toastify';

const toastConfig = {
  position: 'top-center',
  className: 'machine-event-toast',
  autoClose: 3000,
  style: {
    fontSize: '1.25rem',
    fontWeight: 'bold',
    textAlign: 'center',
  },
};

/**
 * Alarms use only safety_violation from backend (PLC register 1490).
 * Payload: { timestamp, violation, cycleNumber }
 */
export const useMachineEvents = (socket) => {
  const activeToasts = useRef({});

  useEffect(() => {
    if (!socket) return;

    const eventHandlers = {
      safety_violation: (data) => {
        const violationMessage =
          data.violation || data.message || data.type || 'Unknown safety violation';
        const message = `Safety: ${violationMessage}`;

        const violationKey = `safety_violation_${violationMessage}`;

        if (!activeToasts.current[violationKey]) {
          const toastId = toast(message, {
            ...toastConfig,
            autoClose: false,
            style: {
              ...toastConfig.style,
              backgroundColor: '#dc2626',
              color: '#ffffff',
              border: '3px solid #991b1b',
            },
            onClose: () => {
              delete activeToasts.current[violationKey];
            },
          });
          activeToasts.current[violationKey] = toastId;
        }
      },
    };

    Object.entries(eventHandlers).forEach(([event, handler]) => {
      socket.on(event, handler);
    });

    return () => {
      Object.keys(eventHandlers).forEach((event) => {
        socket.off(event);
      });
    };
  }, [socket]);
};
