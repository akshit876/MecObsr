/* eslint-disable react/prop-types */
'use client';
import React, { createContext, useContext, useEffect, useState } from 'react';
import io from 'socket.io-client';
import { useSession } from 'next-auth/react';

// Create a Context for the socket connection
const SocketContext = createContext(null);

export const useSocket = () => {
  return useContext(SocketContext);
};

// Socket Provider component
export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [socket3002, setSocket3002] = useState(null);
  const [socket3003, setSocket3003] = useState(null);
  const { status, data: session } = useSession();

  useEffect(() => {
    // Only connect if user is authenticated
    if (status === 'authenticated' && session) {
      console.log('🔌 Attempting to connect to microservices...');

      // Connect to port 3003 for emitting events (new microservice)
      const newSocket3003 = io.connect('http://localhost:3003', {
        withCredentials: true,
        transportOptions: {
          polling: {
            extraHeaders: {
              'my-custom-header': 'value',
            },
          },
        },
        timeout: 10000, // 10 second timeout
        forceNew: true,
      });

      // Add connection event handlers for debugging
      newSocket3003.on('connect', () => {
        console.log('✅ Connected to port 3003 (new microservice)');
      });

      newSocket3003.on('connect_error', (error) => {
        console.error('❌ Failed to connect to port 3003:', error.message);
        console.error('Error details:', error);
      });

      newSocket3003.on('disconnect', (reason) => {
        console.log('🔌 Disconnected from port 3003:', reason);
      });

      setSocket3003(newSocket3003);

      // Connect to port 3002 for receiving events (legacy backend)
      const newSocket3002 = io.connect('http://localhost:3002', {
        withCredentials: true,
        transportOptions: {
          polling: {
            extraHeaders: {
              'my-custom-header': 'value',
            },
          },
        },
        timeout: 10000, // 10 second timeout
        forceNew: true,
      });

      // Add connection event handlers for debugging
      newSocket3002.on('connect', () => {
        console.log('✅ Connected to port 3002 (legacy backend)');
      });

      newSocket3002.on('connect_error', (error) => {
        console.error('❌ Failed to connect to port 3002:', error.message);
        console.error('Error details:', error);
      });

      newSocket3002.on('disconnect', (reason) => {
        console.log('🔌 Disconnected from port 3002:', reason);
      });

      setSocket3002(newSocket3002);

      // Set the main socket to 3003 for emitting events
      setSocket(newSocket3003);

      console.log('🚀 Socket connections initialized');

      return () => {
        console.log('🧹 Cleaning up socket connections...');
        newSocket3003.disconnect();
        newSocket3002.disconnect();
      };
    }

    // Cleanup socket if session ends
    return () => {
      if (socket3003) {
        socket3003.disconnect();
        setSocket3003(null);
      }
      if (socket3002) {
        socket3002.disconnect();
        setSocket3002(null);
      }
      if (socket) {
        socket.disconnect();
        setSocket(null);
      }
    };
  }, [status, session]);

  // Provide both sockets in context
  const socketContextValue = {
    socket, // Main socket for emitting events (port 3003)
    socket3002, // Socket for receiving events from legacy backend
    socket3003, // Socket for receiving events from new microservice
  };

  return <SocketContext.Provider value={socketContextValue}>{children}</SocketContext.Provider>;
};
