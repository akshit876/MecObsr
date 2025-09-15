import { useSocket } from '@/SocketContext';
import { useState, useEffect, useCallback } from 'react';
import { useProtectedRoute } from './useProtectedRoute';

export const useCsvData = () => {
  const [csvData, setCsvData] = useState([]);
  const [loading, setLoading] = useState(true);
  const socket = useSocket();
  const { session } = useProtectedRoute();

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

    // Handle data refresh events
    const handleDataRefresh = () => {
      console.log('Data refresh requested by server');
      requestCsvData();
    };

    const handleDataUpdated = (data) => {
      console.log('Data updated, refreshing...', data);
      requestCsvData();
    };

    socket.on('request-data-refresh', handleDataRefresh);
    socket.on('data_updated', handleDataUpdated);

    // Initial request for data
    requestCsvData();

    // Cleanup
    return () => {
      socket.off('csv-data', handleCsvData);
      socket.off('connect');
      socket.off('reconnect');
      socket.off('request-data-refresh', handleDataRefresh);
      socket.off('data_updated', handleDataUpdated);
    };
  }, [socket, session, requestCsvData]);

  // Function to manually refresh data
  const refreshData = () => {
    requestCsvData();
  };

  return {
    csvData,
    loading,
    refreshData, // Expose refresh function
  };
};
