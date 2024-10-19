/* eslint-disable react/prop-types */
"use client";
import React, { createContext, useContext, useEffect, useState } from "react";
import io from "socket.io-client";

// Create a Context for the socket connection
const SocketContext = createContext(null);

export const useSocket = () => {
  return useContext(SocketContext);
};

// Socket Provider component
export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    const newSocket = io.connect("http://localhost:3000"); // Adjust the URL as needed
    setSocket(newSocket);

    return () => {
      newSocket.disconnect(); // Cleanup on unmount
    };
  }, []);

  return (
    <SocketContext.Provider value={socket}>{children}</SocketContext.Provider>
  );
};
