import { useEffect, useRef } from 'react';
import { toast } from 'react-toastify';
// import socket from '../socket'; // Adjust path as needed

const toastConfig = {
  position: "top-center",
  className: "machine-event-toast",
  autoClose: 3000,
  style: {
    fontSize: '1.25rem',
    fontWeight: 'bold',
    textAlign: 'center',
  }
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
          const toastId = toast(data.message || "Part Presence signal detected", {
            ...toastConfig,
            style: {
              ...toastConfig.style,
              color: '#2563eb',
            },
            onClose: () => {
              // Remove from tracking when toast closes
              delete activeToasts.current['part-presence'];
            }
          });
          // Track the active toast
          activeToasts.current['part-presence'] = toastId;
        }
      },
      'emergency-stop': (data) => {
        if (!activeToasts.current['emergency-stop']) {
          const toastId = toast(data.message || "Emergency Stop signal detected", {
            ...toastConfig,
            style: {
              ...toastConfig.style,
              color: '#dc2626',
            },
            onClose: () => {
              delete activeToasts.current['emergency-stop'];
            }
          });
          activeToasts.current['emergency-stop'] = toastId;
        }
      },
      'light-curtation': (data) => {
        if (!activeToasts.current['light-curtation']) {
          const toastId = toast(data.message || "Light Curtation signal detected", {
            ...toastConfig,
            style: {
              ...toastConfig.style,
              color: '#2563eb',
            },
            onClose: () => {
              delete activeToasts.current['light-curtation'];
            }
          });
          activeToasts.current['light-curtation'] = toastId;
        }
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