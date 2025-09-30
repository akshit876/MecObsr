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
      // Listen for error events from server
      error: (data) => {
        const errorType = data.type || 'error';
        const message = data.message || 'An error occurred';

        // Map different error types to appropriate toast messages
        let toastKey = errorType.toLowerCase().replace(/_/g, '-');
        let toastMessage = message;
        let toastColor = '#dc2626'; // Default red for errors

        // Handle specific error types
        if (errorType.includes('MACHINE_STOP') || errorType.includes('COMPONENT_ALREADY_MARKED')) {
          toastKey = 'part-presence';
          toastMessage = 'Part not present or already marked';
          toastColor = '#2563eb';
        } else if (errorType.includes('CAMERA_DATA_MISMATCH')) {
          toastKey = 'camera-error';
          toastMessage = 'Camera data incorrect';
          toastColor = '#f59e0b';
        } else if (errorType.includes('FIRST_SCAN_ERROR')) {
          toastKey = 'scan-error';
          toastMessage = 'First scan error';
          toastColor = '#dc2626';
        }

        // Check if toast already exists
        if (!activeToasts.current[toastKey]) {
          const toastId = toast(toastMessage, {
            ...toastConfig,
            style: {
              ...toastConfig.style,
              color: toastColor,
            },
            onClose: () => {
              delete activeToasts.current[toastKey];
            },
          });
          activeToasts.current[toastKey] = toastId;
        }
      },
      // Listen for machine-stop events
      'machine-stop': (data) => {
        if (!activeToasts.current['machine-stop']) {
          const toastId = toast(data.message || 'Machine stopped', {
            ...toastConfig,
            style: {
              ...toastConfig.style,
              color: '#dc2626',
            },
            onClose: () => {
              delete activeToasts.current['machine-stop'];
            },
          });
          activeToasts.current['machine-stop'] = toastId;
        }
      },
      // Listen for alert events
      alert: (data) => {
        if (!activeToasts.current['alert']) {
          const toastId = toast(data.message || 'Alert', {
            ...toastConfig,
            style: {
              ...toastConfig.style,
              color: '#f59e0b',
            },
            onClose: () => {
              delete activeToasts.current['alert'];
            },
          });
          activeToasts.current['alert'] = toastId;
        }
      },
      // Keep original event handlers for backward compatibility
      'part-presence': (data) => {
        if (!activeToasts.current['part-presence']) {
          const toastId = toast(data.message || 'Part not present', {
            ...toastConfig,
            style: {
              ...toastConfig.style,
              color: '#2563eb',
            },
            onClose: () => {
              delete activeToasts.current['part-presence'];
            },
          });
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
