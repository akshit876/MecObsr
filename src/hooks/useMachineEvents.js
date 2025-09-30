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

export const useMachineEvents = (socket, safetySocket = null) => {
  // Add ref to track active toasts
  const activeToasts = useRef({});

  // Function to clear all toasts
  const clearAllToasts = () => {
    Object.values(activeToasts.current).forEach((toastId) => {
      if (toastId) {
        toast.dismiss(toastId);
      }
    });
    activeToasts.current = {};
  };

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

        // Clear existing toast of same type before showing new one
        if (activeToasts.current[toastKey]) {
          toast.dismiss(activeToasts.current[toastKey]);
          delete activeToasts.current[toastKey];
        }

        // Show new toast
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
      // Listen for safety violation events
      safety_violation: (data) => {
        console.log('🚨 Safety violation event received in useMachineEvents:', data);

        // Clear any existing safety violation toast
        if (activeToasts.current['safety-violation']) {
          toast.dismiss(activeToasts.current['safety-violation']);
          delete activeToasts.current['safety-violation'];
        }

        // Determine violation type and message
        let violationMessage = '🚨 SAFETY VIOLATION! 🚨';
        let violationColor = '#dc2626';

        if (Array.isArray(data)) {
          if (data.includes('emergency_stop')) {
            violationMessage = '🚨 EMERGENCY STOP! 🚨';
          } else if (data.includes('part_not_present') || data.includes('part not present')) {
            violationMessage = '🚨 PART NOT PRESENT! 🚨';
            violationColor = '#2563eb';
          } else if (data.includes('safety_sensor_error') || data.includes('safety sensor error')) {
            violationMessage = '🚨 SAFETY SENSOR ERROR! 🚨';
            violationColor = '#f59e0b';
          }
        } else if (typeof data === 'string') {
          if (data.includes('emergency_stop') || data.includes('Emergency stop')) {
            violationMessage = '🚨 EMERGENCY STOP! 🚨';
          } else if (
            data.includes('part_not_present') ||
            data.includes('part not present') ||
            data.includes('Part not present')
          ) {
            violationMessage = '🚨 PART NOT PRESENT! 🚨';
            violationColor = '#2563eb';
          } else if (
            data.includes('safety_sensor_error') ||
            data.includes('safety sensor error') ||
            data.includes('Safety sensor error')
          ) {
            violationMessage = '🚨 SAFETY SENSOR ERROR! 🚨';
            violationColor = '#f59e0b';
          }
        } else if (data.alarms && Array.isArray(data.alarms)) {
          if (data.alarms.includes('emergency_stop')) {
            violationMessage = '🚨 EMERGENCY STOP! 🚨';
          } else if (
            data.alarms.includes('part_not_present') ||
            data.alarms.includes('part not present')
          ) {
            violationMessage = '🚨 PART NOT PRESENT! 🚨';
            violationColor = '#2563eb';
          } else if (
            data.alarms.includes('safety_sensor_error') ||
            data.alarms.includes('safety sensor error')
          ) {
            violationMessage = '🚨 SAFETY SENSOR ERROR! 🚨';
            violationColor = '#f59e0b';
          }
        } else if (data.activeAlarms && Array.isArray(data.activeAlarms)) {
          if (data.activeAlarms.includes('emergency_stop')) {
            violationMessage = '🚨 EMERGENCY STOP! 🚨';
          } else if (
            data.activeAlarms.includes('part_not_present') ||
            data.activeAlarms.includes('part not present')
          ) {
            violationMessage = '🚨 PART NOT PRESENT! 🚨';
            violationColor = '#2563eb';
          } else if (
            data.activeAlarms.includes('safety_sensor_error') ||
            data.activeAlarms.includes('safety sensor error')
          ) {
            violationMessage = '🚨 SAFETY SENSOR ERROR! 🚨';
            violationColor = '#f59e0b';
          }
        } else if (data.violation) {
          // Handle data.violation field
          if (
            data.violation.includes('Emergency stop') ||
            data.violation.includes('emergency_stop')
          ) {
            violationMessage = '🚨 EMERGENCY STOP! 🚨';
          } else if (
            data.violation.includes('Part not present') ||
            data.violation.includes('part not present')
          ) {
            violationMessage = '🚨 PART NOT PRESENT! 🚨';
            violationColor = '#2563eb';
          } else if (
            data.violation.includes('Safety sensor') ||
            data.violation.includes('safety sensor')
          ) {
            violationMessage = '🚨 SAFETY SENSOR ERROR! 🚨';
            violationColor = '#f59e0b';
          }
        }

        const toastId = toast(violationMessage, {
          ...toastConfig,
          style: {
            ...toastConfig.style,
            color: violationColor,
            backgroundColor: '#dc2626',
            border: '4px solid #b91c1c',
            borderRadius: '10px',
            boxShadow: '0 6px 20px rgba(220, 38, 38, 0.6)',
          },
          onClose: () => {
            delete activeToasts.current['safety-violation'];
          },
        });
        activeToasts.current['safety-violation'] = toastId;
      },
      // Listen for emergency stop events
      emergency_stop: (data) => {
        console.log('🚨 Emergency stop event received in useMachineEvents:', data);

        // Clear any existing emergency stop toast
        if (activeToasts.current['emergency-stop']) {
          toast.dismiss(activeToasts.current['emergency-stop']);
          delete activeToasts.current['emergency-stop'];
        }

        const toastId = toast('🚨 EMERGENCY STOP! 🚨', {
          ...toastConfig,
          style: {
            ...toastConfig.style,
            color: '#ffffff',
            backgroundColor: '#dc2626',
            border: '4px solid #b91c1c',
            borderRadius: '10px',
            boxShadow: '0 6px 20px rgba(220, 38, 38, 0.6)',
          },
          onClose: () => {
            delete activeToasts.current['emergency-stop'];
          },
        });
        activeToasts.current['emergency-stop'] = toastId;
      },
      // Listen for part not present events
      'part-not-present': (data) => {
        console.log('🚨 Part not present event received in useMachineEvents:', data);

        // Clear any existing part not present toast
        if (activeToasts.current['part-not-present']) {
          toast.dismiss(activeToasts.current['part-not-present']);
          delete activeToasts.current['part-not-present'];
        }

        const toastId = toast('🚨 PART NOT PRESENT! 🚨', {
          ...toastConfig,
          style: {
            ...toastConfig.style,
            color: '#ffffff',
            backgroundColor: '#2563eb',
            border: '4px solid #1d4ed8',
            borderRadius: '10px',
            boxShadow: '0 6px 20px rgba(37, 99, 235, 0.6)',
          },
          onClose: () => {
            delete activeToasts.current['part-not-present'];
          },
        });
        activeToasts.current['part-not-present'] = toastId;
      },
      // Listen for safety sensor error events
      'safety-sensor-error': (data) => {
        console.log('🚨 Safety sensor error event received in useMachineEvents:', data);

        // Clear any existing safety sensor error toast
        if (activeToasts.current['safety-sensor-error']) {
          toast.dismiss(activeToasts.current['safety-sensor-error']);
          delete activeToasts.current['safety-sensor-error'];
        }

        const toastId = toast('🚨 SAFETY SENSOR ERROR! 🚨', {
          ...toastConfig,
          style: {
            ...toastConfig.style,
            color: '#ffffff',
            backgroundColor: '#f59e0b',
            border: '4px solid #d97706',
            borderRadius: '10px',
            boxShadow: '0 6px 20px rgba(245, 158, 11, 0.6)',
          },
          onClose: () => {
            delete activeToasts.current['safety-sensor-error'];
          },
        });
        activeToasts.current['safety-sensor-error'] = toastId;
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
      // Listen for clear events to dismiss toasts
      'clear-toasts': () => {
        clearAllToasts();
      },
      // Listen for specific clear events
      'clear-error': (data) => {
        const errorType = data.type || 'error';
        const toastKey = errorType.toLowerCase().replace(/_/g, '-');
        if (activeToasts.current[toastKey]) {
          toast.dismiss(activeToasts.current[toastKey]);
          delete activeToasts.current[toastKey];
        }
      },
    };

    // Register all event handlers for main socket
    Object.entries(eventHandlers).forEach(([event, handler]) => {
      socket.on(event, handler);
    });

    // Register safety socket event handlers if available
    if (safetySocket) {
      console.log('🔧 Registering safety socket event handlers in useMachineEvents...');

      // Safety violation events
      safetySocket.on('safety_violation', eventHandlers['safety_violation']);
      safetySocket.on('emergency_stop', eventHandlers['emergency_stop']);
      safetySocket.on('safety_sensor_error', eventHandlers['safety-sensor-error']);
      safetySocket.on('part_not_present', eventHandlers['part-not-present']);
      safetySocket.on('part-not-present', eventHandlers['part-not-present']);
      safetySocket.on('light_curtain_violation', eventHandlers['safety_violation']);
      safetySocket.on('door_open_violation', eventHandlers['safety_violation']);
      safetySocket.on('pressure_violation', eventHandlers['safety_violation']);
      safetySocket.on('temperature_violation', eventHandlers['safety_violation']);
      safetySocket.on('vibration_violation', eventHandlers['safety_violation']);

      console.log('✅ Safety socket event handlers registered in useMachineEvents');
    }

    // Cleanup function
    return () => {
      // Clear all toasts when component unmounts
      clearAllToasts();

      // Remove main socket event listeners
      Object.keys(eventHandlers).forEach((event) => {
        socket.off(event);
      });

      // Remove safety socket event listeners
      if (safetySocket) {
        safetySocket.off('safety_violation', eventHandlers['safety_violation']);
        safetySocket.off('emergency_stop', eventHandlers['emergency_stop']);
        safetySocket.off('safety_sensor_error', eventHandlers['safety-sensor-error']);
        safetySocket.off('part_not_present', eventHandlers['part-not-present']);
        safetySocket.off('part-not-present', eventHandlers['part-not-present']);
        safetySocket.off('light_curtain_violation', eventHandlers['safety_violation']);
        safetySocket.off('door_open_violation', eventHandlers['safety_violation']);
        safetySocket.off('pressure_violation', eventHandlers['safety_violation']);
        safetySocket.off('temperature_violation', eventHandlers['safety_violation']);
        safetySocket.off('vibration_violation', eventHandlers['safety_violation']);
      }
    };
  }, [socket, safetySocket]);
};
