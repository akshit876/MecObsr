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
      'part-present': (data) => {
        if (!activeToasts.current['part-present']) {
          const toastId = toast(data.message || "Part not present", {
            ...toastConfig,
            style: {
              ...toastConfig.style,
              color: '#f59e0b', // Amber/orange for warnings
            },
            onClose: () => {
              delete activeToasts.current['part-present'];
            }
          });
          activeToasts.current['part-present'] = toastId;
        }
      },
      'emergency-button': (data) => {
        if (!activeToasts.current['emergency-button']) {
          const toastId = toast(data.message || "Emergency push button pressed", {
            ...toastConfig,
            style: {
              ...toastConfig.style,
              color: '#dc2626', // Red color for emergency
            },
            onClose: () => {
              delete activeToasts.current['emergency-button'];
            }
          });
          activeToasts.current['emergency-button'] = toastId;
        }
      },
      'safety-curtain': (data) => {
        if (!activeToasts.current['safety-curtain']) {
          const toastId = toast(data.message || "Safety curtain error", {
            ...toastConfig,
            style: {
              ...toastConfig.style,
              color: '#dc2626', // Red for safety issues
            },
            onClose: () => {
              delete activeToasts.current['safety-curtain'];
            }
          });
          activeToasts.current['safety-curtain'] = toastId;
        }
      },
      'servo-position': (data) => {
        if (!activeToasts.current['servo-position']) {
          const toastId = toast(data.message || "Servo not home position", {
            ...toastConfig,
            style: {
              ...toastConfig.style,
              color: '#2563eb', // Blue for informational
            },
            onClose: () => {
              delete activeToasts.current['servo-position'];
            }
          });
          activeToasts.current['servo-position'] = toastId;
        }
      },
      'reject-bin': (data) => {
        if (!activeToasts.current['reject-bin']) {
          const toastId = toast(data.message || "Put the part in the rejection bin", {
            ...toastConfig,
            style: {
              ...toastConfig.style,
              color: '#f59e0b', // Amber/orange for warnings
            },
            onClose: () => {
              delete activeToasts.current['reject-bin'];
            }
          });
          activeToasts.current['reject-bin'] = toastId;
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