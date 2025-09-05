import { useRef, useCallback } from 'react';
import { toast } from 'react-toastify';

/**
 * Centralized alarm management hook to ensure only one safety alarm popup appears at a time
 * This prevents multiple safety alarms from stacking up and overwhelming the user
 */
export const useAlarmManager = () => {
  const activeAlarmRef = useRef(null);
  const alarmQueueRef = useRef([]);
  const isProcessingRef = useRef(false);

  // Configuration for different alarm types
  const alarmConfigs = {
    'safety-violation': {
      type: 'error',
      position: 'top-center',
      autoClose: 8000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
      style: {
        fontSize: '1.5rem',
        fontWeight: 'bold',
        backgroundColor: '#dc2626',
        color: 'white',
        textAlign: 'center',
        zIndex: 9999,
      },
    },
    'emergency-stop': {
      type: 'error',
      position: 'top-center',
      autoClose: 10000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
      style: {
        fontSize: '1.5rem',
        fontWeight: 'bold',
        backgroundColor: '#dc2626',
        color: 'white',
        textAlign: 'center',
        zIndex: 9999,
      },
    },
    'part-presence': {
      type: 'warning',
      position: 'top-center',
      autoClose: 5000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
      style: {
        fontSize: '1.25rem',
        fontWeight: 'bold',
        backgroundColor: '#f59e0b',
        color: 'white',
        textAlign: 'center',
        zIndex: 9999,
      },
    },
    'light-curtain': {
      type: 'warning',
      position: 'top-center',
      autoClose: 5000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
      style: {
        fontSize: '1.25rem',
        fontWeight: 'bold',
        backgroundColor: '#f59e0b',
        color: 'white',
        textAlign: 'center',
        zIndex: 9999,
      },
    },
  };

  // Process the next alarm in the queue
  const processNextAlarm = useCallback(() => {
    if (isProcessingRef.current || alarmQueueRef.current.length === 0) {
      return;
    }

    isProcessingRef.current = true;
    const nextAlarm = alarmQueueRef.current.shift();
    
    if (nextAlarm) {
      const config = alarmConfigs[nextAlarm.type] || alarmConfigs['safety-violation'];
      
      const toastId = toast[config.type](nextAlarm.message, {
        ...config,
        onClose: () => {
          activeAlarmRef.current = null;
          isProcessingRef.current = false;
          // Process next alarm in queue after a short delay
          setTimeout(() => {
            processNextAlarm();
          }, 500);
        },
      });

      activeAlarmRef.current = {
        id: toastId,
        type: nextAlarm.type,
        message: nextAlarm.message,
        timestamp: Date.now(),
      };
    } else {
      isProcessingRef.current = false;
    }
  }, []);

  // Show alarm with priority handling
  const showAlarm = useCallback((type, message, priority = 'normal') => {
    const alarm = {
      type,
      message,
      priority,
      timestamp: Date.now(),
    };

    // If there's already an active alarm of the same type, don't add another
    if (activeAlarmRef.current && activeAlarmRef.current.type === type) {
      console.log(`Alarm of type ${type} already active, skipping duplicate`);
      return;
    }

    // If there's an active alarm, add to queue
    if (activeAlarmRef.current) {
      // For high priority alarms (safety violations, emergency stops), 
      // clear current alarm and show immediately
      if (priority === 'high' || type === 'safety-violation' || type === 'emergency-stop') {
        // Dismiss current alarm
        if (activeAlarmRef.current.id) {
          toast.dismiss(activeAlarmRef.current.id);
        }
        activeAlarmRef.current = null;
        isProcessingRef.current = false;
        
        // Add to front of queue
        alarmQueueRef.current.unshift(alarm);
      } else {
        // Add to queue for normal priority alarms
        alarmQueueRef.current.push(alarm);
      }
    } else {
      // No active alarm, add to queue and process immediately
      alarmQueueRef.current.push(alarm);
    }

    processNextAlarm();
  }, [processNextAlarm]);

  // Clear all alarms
  const clearAllAlarms = useCallback(() => {
    if (activeAlarmRef.current && activeAlarmRef.current.id) {
      toast.dismiss(activeAlarmRef.current.id);
    }
    activeAlarmRef.current = null;
    alarmQueueRef.current = [];
    isProcessingRef.current = false;
  }, []);

  // Get current alarm status
  const getAlarmStatus = useCallback(() => {
    return {
      hasActiveAlarm: !!activeAlarmRef.current,
      activeAlarm: activeAlarmRef.current,
      queueLength: alarmQueueRef.current.length,
      isProcessing: isProcessingRef.current,
    };
  }, []);

  return {
    showAlarm,
    clearAllAlarms,
    getAlarmStatus,
  };
};
