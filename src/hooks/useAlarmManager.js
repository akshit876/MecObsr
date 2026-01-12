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
  const activeAlarmsByKeyRef = useRef(new Map()); // Track alarms by unique key

  // Configuration for different alarm types
  const alarmConfigs = {
    'safety-violation': {
      type: 'error',
      position: 'top-right',
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
      position: 'top-right',
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
      position: 'top-right',
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
      position: 'top-right',
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
          // Remove from key tracking if it exists
          if (activeAlarmRef.current?.key) {
            activeAlarmsByKeyRef.current.delete(activeAlarmRef.current.key);
          }
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
        key: nextAlarm.key,
      };
      
      // Track alarm by key
      if (nextAlarm.key) {
        activeAlarmsByKeyRef.current.set(nextAlarm.key, toastId);
      }
    } else {
      isProcessingRef.current = false;
    }
  }, []);

  // Show alarm with priority handling
  const showAlarm = useCallback((type, message, priority = 'normal', key = null) => {
    // Use provided key or generate one from type and message
    const alarmKey = key || `${type}_${message}`;
    
    const alarm = {
      type,
      message,
      priority,
      timestamp: Date.now(),
      key: alarmKey,
    };

    // If there's already an active alarm with the same key, don't add another
    if (activeAlarmsByKeyRef.current.has(alarmKey)) {
      console.log(`Alarm with key ${alarmKey} already active, skipping duplicate`);
      return;
    }

    // If there's already an active alarm of the same type (without key), don't add another
    if (activeAlarmRef.current && activeAlarmRef.current.type === type && !key) {
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

  // Clear alarm by unique key
  const clearAlarmByKey = useCallback((key) => {
    const toastId = activeAlarmsByKeyRef.current.get(key);
    if (toastId) {
      toast.dismiss(toastId);
      activeAlarmsByKeyRef.current.delete(key);
      
      // If this was the active alarm, clear it
      if (activeAlarmRef.current && activeAlarmRef.current.key === key) {
        activeAlarmRef.current = null;
        isProcessingRef.current = false;
        // Process next alarm in queue
        setTimeout(() => {
          processNextAlarm();
        }, 500);
      }
      
      // Remove from queue if it exists there
      alarmQueueRef.current = alarmQueueRef.current.filter(alarm => alarm.key !== key);
      
      return true;
    }
    return false;
  }, [processNextAlarm]);

  // Clear all alarms
  const clearAllAlarms = useCallback(() => {
    if (activeAlarmRef.current && activeAlarmRef.current.id) {
      toast.dismiss(activeAlarmRef.current.id);
    }
    activeAlarmRef.current = null;
    alarmQueueRef.current = [];
    isProcessingRef.current = false;
    activeAlarmsByKeyRef.current.clear();
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
    clearAlarmByKey,
    clearAllAlarms,
    getAlarmStatus,
  };
};
