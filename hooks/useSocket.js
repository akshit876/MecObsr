/* eslint-disable consistent-return */
import { useSocket } from '@/SocketContext';
import { useState, useEffect, useCallback } from 'react';
import { useProtectedRoute } from './useProtectedRoute';

export const useCsvData = () => {
  const [csvData, setCsvData] = useState([]);
  const [loading, setLoading] = useState(true);
  const socket = useSocket();
  const { session, status } = useProtectedRoute();

  // Create a memoized function for requesting data
  const requestCsvData = useCallback(() => {
    if (!socket || !session?.user) return;

    setLoading(true);
    socket.emit('request-csv-data', {
      userId: session.user.id,
      userName: session.user.email,
      userRole: session.user.role,
    });
  }, [socket, session]);

  useEffect(() => {
    if (!socket || !session) return;

    // Handle incoming CSV data
    const handleCsvData = (data) => {
      console.log('Received CSV data:', data);
      setCsvData(data);
      setLoading(false);
    };

    // Setup socket event listeners
    socket.on('csv-data', handleCsvData);
    socket.on('connect', () => {
      console.log('Socket connected, requesting data...');
      requestCsvData();
    });
    socket.on('reconnect', () => {
      console.log('Socket reconnected, requesting data...');
      requestCsvData();
    });

    // Initial request for data
    requestCsvData();

    // Cleanup
    return () => {
      socket.off('csv-data', handleCsvData);
      socket.off('connect');
      socket.off('reconnect');
    };
  }, [socket, session, requestCsvData]);

  // Function to manually refresh data
  const refreshData = () => {
    requestCsvData();
  };

  return { 
    csvData, 
    loading,
    refreshData // Expose refresh function
  };
};
