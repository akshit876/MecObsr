import { useEffect } from 'react';
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
  useEffect(() => {
    if (!socket) return;

    const eventHandlers = {
      'part-presence': (data) => {
        toast(data.message || "Part Presence signal detected", {
          ...toastConfig,
          style: {
            ...toastConfig.style,
            color: '#2563eb', // blue-600
          }
        });
      },
      'emergency-stop': (data) => {
        toast(data.message || "Emergency Stop signal detected", {
          ...toastConfig,
          style: {
            ...toastConfig.style,
            color: '#dc2626', // red-600
          }
        });
      },
      'light-curtation': (data) => {
        toast(data.message || "Light Curtation signal detected", {
          ...toastConfig,
          style: {
            ...toastConfig.style,
            color: '#2563eb', // blue-600
          }
        });
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