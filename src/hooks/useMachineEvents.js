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
      'part-present': (data) => {
        if (!activeToasts.current['part-present']) {
          const toastId = toast(data.message || 'Part not present', {
            ...toastConfig,
            style: {
              ...toastConfig.style,
              color: '#f59e0b', // Amber/orange for warnings
            },
            onClose: () => {
              delete activeToasts.current['part-present'];
            },
          });
          activeToasts.current['part-present'] = toastId;
        }
      },
      'emergency-button': (data) => {
        if (!activeToasts.current['emergency-button']) {
          const toastId = toast(data.message || 'Emergency push button pressed', {
            ...toastConfig,
            style: {
              ...toastConfig.style,
              color: '#dc2626', // Red color for emergency
            },
            onClose: () => {
              delete activeToasts.current['emergency-button'];
            },
          });
          activeToasts.current['emergency-button'] = toastId;
        }
      },
      'safety-curtain': (data) => {
        if (!activeToasts.current['safety-curtain']) {
          const toastId = toast(data.message || 'Safety curtain error', {
            ...toastConfig,
            style: {
              ...toastConfig.style,
              color: '#dc2626', // Red for safety issues
            },
            onClose: () => {
              delete activeToasts.current['safety-curtain'];
            },
          });
          activeToasts.current['safety-curtain'] = toastId;
        }
      },
      'servo-position': (data) => {
        if (!activeToasts.current['servo-position']) {
          const toastId = toast(data.message || 'Servo not home position', {
            ...toastConfig,
            style: {
              ...toastConfig.style,
              color: '#2563eb', // Blue for informational
            },
            onClose: () => {
              delete activeToasts.current['servo-position'];
            },
          });
          activeToasts.current['servo-position'] = toastId;
        }
      },
      'reject-bin': (data) => {
        if (!activeToasts.current['reject-bin']) {
          const toastId = toast(data.message || 'Put the part in the rejection bin', {
            ...toastConfig,
            style: {
              ...toastConfig.style,
              color: '#f59e0b', // Amber/orange for warnings
            },
            onClose: () => {
              delete activeToasts.current['reject-bin'];
            },
          });
          activeToasts.current['reject-bin'] = toastId;
        }
      },
      ftp: (data) => {
        if (!activeToasts.current['ftp']) {
          const toastId = toast(data.message || '⚠️ FTP CONNECTION ERROR ⚠️', {
            ...toastConfig,
            style: {
              ...toastConfig.style,
              color: '#ef4444', // Bright red
              fontSize: '1.25rem',
              fontWeight: 'bold',
              backgroundColor: '#fee2e2', // Light red background
              border: '2px solid #ef4444',
            },
            duration: 0, // Toast stays until manually closed
            icon: '🚨',
            onClose: () => {
              delete activeToasts.current['ftp'];
            },
          });
          activeToasts.current['ftp'] = toastId;
        }
      },
      image_save_error: (data) => {
        if (!activeToasts.current['image_save_error']) {
          const toastId = toast(data.message || 'Failed to save image', {
            ...toastConfig,
            style: {
              ...toastConfig.style,
              color: '#dc2626', // Red for errors
              backgroundColor: '#fef2f2', // Light red background
              border: '2px solid #dc2626',
            },
            autoClose: 5000, // Stays longer than regular toasts
            icon: '❌',
            onClose: () => {
              delete activeToasts.current['image_save_error'];
            },
          });
          activeToasts.current['image_save_error'] = toastId;
        }
      },
      validation_error: (data) => {
        if (!activeToasts.current['validation_error']) {
          const toastId = toast(data.message || 'Validation Error', {
            ...toastConfig,
            style: {
              ...toastConfig.style,
              color: '#dc2626', // Red for errors
              backgroundColor: '#fef2f2', // Light red background
              border: '2px solid #dc2626',
            },
            autoClose: 5000, // Stays longer than regular toasts
            icon: '⚠️',
            onClose: () => {
              delete activeToasts.current['validation_error'];
            },
          });
          activeToasts.current['validation_error'] = toastId;
        }
      },
      'tap-missing1': (data) => {
        if (!activeToasts.current['tap-missing1']) {
          const toastId = toast(data.message || 'Tap missing 1...', {
            ...toastConfig,
            style: {
              ...toastConfig.style,
              color: '#dc2626',
              backgroundColor: '#fef2f2',
              border: '2px solid #dc2626',
            },
            autoClose: 5000,
            icon: '⚠️',
            onClose: () => {
              delete activeToasts.current['tap-missing1'];
            },
          });
          activeToasts.current['tap-missing1'] = toastId;
        }
      },
      'tap-missing2': (data) => {
        if (!activeToasts.current['tap-missing2']) {
          const toastId = toast(data.message || 'Tap missing 2...', {
            ...toastConfig,
            style: {
              ...toastConfig.style,
              color: '#dc2626',
              backgroundColor: '#fef2f2',
              border: '2px solid #dc2626',
            },
            autoClose: 5000,
            icon: '⚠️',
            onClose: () => {
              delete activeToasts.current['tap-missing2'];
            },
          });
          activeToasts.current['tap-missing2'] = toastId;
        }
      },
      'tap-missing3': (data) => {
        if (!activeToasts.current['tap-missing3']) {
          const toastId = toast(data.message || 'Tap missing 3...', {
            ...toastConfig,
            style: {
              ...toastConfig.style,
              color: '#dc2626',
              backgroundColor: '#fef2f2',
              border: '2px solid #dc2626',
            },
            autoClose: 5000,
            icon: '⚠️',
            onClose: () => {
              delete activeToasts.current['tap-missing3'];
            },
          });
          activeToasts.current['tap-missing3'] = toastId;
        }
      },
      'tap-missing4': (data) => {
        if (!activeToasts.current['tap-missing4']) {
          const toastId = toast(data.message || 'Tap missing 4...', {
            ...toastConfig,
            style: {
              ...toastConfig.style,
              color: '#dc2626',
              backgroundColor: '#fef2f2',
              border: '2px solid #dc2626',
            },
            autoClose: 5000,
            icon: '⚠️',
            onClose: () => {
              delete activeToasts.current['tap-missing4'];
            },
          });
          activeToasts.current['tap-missing4'] = toastId;
        }
      },
      'tap-missing5': (data) => {
        if (!activeToasts.current['tap-missing5']) {
          const toastId = toast(data.message || 'Tap missing 5...', {
            ...toastConfig,
            style: {
              ...toastConfig.style,
              color: '#dc2626',
              backgroundColor: '#fef2f2',
              border: '2px solid #dc2626',
            },
            autoClose: 5000,
            icon: '⚠️',
            onClose: () => {
              delete activeToasts.current['tap-missing5'];
            },
          });
          activeToasts.current['tap-missing5'] = toastId;
        }
      },
      'tap-missing6': (data) => {
        if (!activeToasts.current['tap-missing6']) {
          const toastId = toast(data.message || 'Tap missing 6...', {
            ...toastConfig,
            style: {
              ...toastConfig.style,
              color: '#dc2626',
              backgroundColor: '#fef2f2',
              border: '2px solid #dc2626',
            },
            autoClose: 5000,
            icon: '⚠️',
            onClose: () => {
              delete activeToasts.current['tap-missing6'];
            },
          });
          activeToasts.current['tap-missing6'] = toastId;
        }
      },
      'tap-missing7': (data) => {
        if (!activeToasts.current['tap-missing7']) {
          const toastId = toast(data.message || 'Tap missing 7...', {
            ...toastConfig,
            style: {
              ...toastConfig.style,
              color: '#dc2626',
              backgroundColor: '#fef2f2',
              border: '2px solid #dc2626',
            },
            autoClose: 5000,
            icon: '⚠️',
            onClose: () => {
              delete activeToasts.current['tap-missing7'];
            },
          });
          activeToasts.current['tap-missing7'] = toastId;
        }
      },
      'tap-missing8': (data) => {
        if (!activeToasts.current['tap-missing8']) {
          const toastId = toast(data.message || 'Tap missing 8...', {
            ...toastConfig,
            style: {
              ...toastConfig.style,
              color: '#dc2626',
              backgroundColor: '#fef2f2',
              border: '2px solid #dc2626',
            },
            autoClose: 5000,
            icon: '⚠️',
            onClose: () => {
              delete activeToasts.current['tap-missing8'];
            },
          });
          activeToasts.current['tap-missing8'] = toastId;
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
