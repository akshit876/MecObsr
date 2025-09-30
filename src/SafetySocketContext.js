/* eslint-disable react/prop-types */
'use client';
import React, { createContext, useContext, useEffect, useState } from 'react';
import io from 'socket.io-client';
import { useSession } from 'next-auth/react';

// Create a Context for the safety socket connection
const SafetySocketContext = createContext(null);

export const useSafetySocket = () => {
  return useContext(SafetySocketContext);
};

// Safety Socket Provider component
export const SafetySocketProvider = ({ children }) => {
  const [safetySocket, setSafetySocket] = useState(null);
  const { status, data: session } = useSession();

  useEffect(() => {
    // Only connect if user is authenticated
    if (status === 'authenticated' && session) {
      const newSafetySocket = io.connect('http://localhost:3005', {
        withCredentials: true,
        transportOptions: {
          polling: {
            extraHeaders: {
              'my-custom-header': 'value',
            },
          },
        },
      });
      setSafetySocket(newSafetySocket);

      return () => {
        newSafetySocket.disconnect();
      };
    }

    // Cleanup socket if session ends
    return () => {
      if (safetySocket) {
        safetySocket.disconnect();
        setSafetySocket(null);
      }
    };
  }, [status, session]);

  return (
    <SafetySocketContext.Provider value={safetySocket}>{children}</SafetySocketContext.Provider>
  );
};
