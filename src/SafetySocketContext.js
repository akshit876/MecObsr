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
    console.log('SafetySocket useEffect triggered:', { status, session: !!session });

    // Only connect if user is authenticated
    if (status === 'authenticated' && session) {
      console.log('Creating safety socket connection to port 3005...');
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

      // Add connection event listeners for debugging
      newSafetySocket.on('connect', () => {
        console.log('✅ Safety Socket Connected to port 3005');
      });

      newSafetySocket.on('disconnect', (reason) => {
        console.log('❌ Safety Socket Disconnected from port 3005:', reason);
      });

      newSafetySocket.on('connect_error', (error) => {
        console.error('🚨 Safety Socket Connection Error:', error);
      });

      newSafetySocket.on('error', (error) => {
        console.error('🚨 Safety Socket Error:', error);
      });

      setSafetySocket(newSafetySocket);

      return () => {
        console.log('Cleaning up safety socket connection...');
        newSafetySocket.disconnect();
      };
    } else {
      console.log('Not authenticated, not creating safety socket connection');
    }

    // Cleanup socket if session ends
    return () => {
      if (safetySocket) {
        console.log('Session ended, cleaning up safety socket...');
        safetySocket.disconnect();
        setSafetySocket(null);
      }
    };
  }, [status, session]);

  return (
    <SafetySocketContext.Provider value={safetySocket}>{children}</SafetySocketContext.Provider>
  );
};
