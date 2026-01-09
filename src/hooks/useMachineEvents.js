import { useEffect, useRef } from 'react';
import { toast } from 'react-toastify';
// import socket from '../socket'; // Adjust path as needed

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

export const useMachineEvents = (socket) => {
  // Add ref to track active toasts
  const activeToasts = useRef({});

  useEffect(() => {
    if (!socket) return;

    const eventHandlers = {
      'part-presence': (data) => {
        // Check if toast already exists
        if (!activeToasts.current['part-presence']) {
          const toastId = toast(data.message || 'Part not present', {
            ...toastConfig,
            style: {
              ...toastConfig.style,
              color: '#2563eb',
            },
            onClose: () => {
              // Remove from tracking when toast closes
              delete activeToasts.current['part-presence'];
            },
          });
          // Track the active toast
          activeToasts.current['part-presence'] = toastId;
        }
      },
      'emergency-stop': (data) => {
        if (!activeToasts.current['emergency-stop']) {
          const toastId = toast(data.message || 'Emergency button pressed', {
            ...toastConfig,
            style: {
              ...toastConfig.style,
              color: '#dc2626',
            },
            onClose: () => {
              delete activeToasts.current['emergency-stop'];
            },
          });
          activeToasts.current['emergency-stop'] = toastId;
        }
      },
      'light-curtation': (data) => {
        if (!activeToasts.current['light-curtation']) {
          const toastId = toast(data.message || 'Light curtain error', {
            ...toastConfig,
            style: {
              ...toastConfig.style,
              color: '#2563eb',
            },
            onClose: () => {
              delete activeToasts.current['light-curtation'];
            },
          });
          activeToasts.current['light-curtation'] = toastId;
        }
      },
      safety_violation: (data) => {
        // Backend sends: { violation, timestamp, cycleNumber, status: 'active' | 'cleared' }
        // Use violation field as the message
        const violationMessage =
          data.violation || data.message || data.type || 'Unknown safety violation';
        const status = data.status || 'active';

        // Create unique key based on violation type to allow multiple different violations
        const violationKey = `safety_violation_${violationMessage}`;

        // If status is 'cleared', dismiss the toast if it exists
        if (status === 'cleared') {
          if (activeToasts.current[violationKey]) {
            toast.dismiss(activeToasts.current[violationKey]);
            delete activeToasts.current[violationKey];
          }
          return;
        }

        // Only show toast if status is 'active' and toast doesn't already exist
        if (status === 'active' && !activeToasts.current[violationKey]) {
          const toastId = toast(violationMessage, {
            ...toastConfig,
            autoClose: false, // Don't auto-close safety violations - user must acknowledge
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
