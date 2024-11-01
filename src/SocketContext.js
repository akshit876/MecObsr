/* eslint-disable react/prop-types */
'use client';
import React, { createContext, useContext, useEffect, useState } from 'react';
import io from 'socket.io-client';
import { useSession } from "next-auth/react";

// Create a Context for the socket connection
const SocketContext = createContext(null);

export const useSocket = () => {
  return useContext(SocketContext);
};

// Socket Provider component
export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const { status, data: session } = useSession();

  useEffect(() => {
    // Only connect if user is authenticated
    if (status === "authenticated" && session) {
      const newSocket = io.connect('http://localhost:3002', {
        withCredentials: true,
        transportOptions: {
          polling: {
            extraHeaders: {
              'my-custom-header': 'value',
            },
          },
        },
      });
      setSocket(newSocket);

      return () => {
        newSocket.disconnect();
      };
    }
    
    // Cleanup socket if session ends
    return () => {
      if (socket) {
        socket.disconnect();
        setSocket(null);
      }
    };
  }, [status, session]);

  return <SocketContext.Provider value={socket}>{children}</SocketContext.Provider>;
};
