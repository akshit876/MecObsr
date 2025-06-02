/* eslint-disable consistent-return */
import { useSocket } from '@/SocketContext';
import { useState, useEffect, useCallback } from 'react';

export const useCsvData = () => {
  const [csvData, setCsvData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const [totalRecords, setTotalRecords] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const socket = useSocket();

  useEffect(() => {
    if (!socket) return;

    const handleCsvData = (data) => {
      setCsvData(data);
      setLoading(false);
    };

    const handlePaginatedData = (response) => {
      const { data, pagination } = response;

      setCsvData((prevData) => {
        // If it's the first page, replace the data
        if (pagination.currentPage === 1) {
          return { data };
        }
        // Otherwise, append to existing data
        return {
          data: [...(prevData?.data || []), ...data],
        };
      });

      setTotalRecords(pagination.total);
      setHasMore(pagination.hasMore);
      setCurrentPage(pagination.currentPage);
      setLoading(false);
    };

    const handleError = (error) => {
      console.error('Socket error:', error);
      setError(error.message || 'Failed to fetch data');
      setLoading(false);
    };

    // Set up socket listeners
    socket.on('csv-data', handleCsvData);
    socket.on('paginated-data', handlePaginatedData);
    socket.on('error', handleError);

    // Request initial data (500 records)
    socket.emit('request-paginated-data', {
      limit: 500,
      skip: 0,
      sortBy: 'Timestamp',
      sortOrder: -1,
    });

    return () => {
      socket.off('csv-data', handleCsvData);
      socket.off('paginated-data', handlePaginatedData);
      socket.off('error', handleError);
    };
  }, [socket]);

  // Function to load more data
  const loadMoreData = () => {
    if (!socket || loading || !hasMore) return;

    setLoading(true);
    const skip = currentPage * 500; // Calculate skip based on current page

    socket.emit('request-paginated-data', {
      limit: 500,
      skip: skip,
      sortBy: 'Timestamp',
      sortOrder: -1,
    });
  };

  // Function to refresh data (start from beginning)
  const refreshData = () => {
    if (!socket) return;

    setLoading(true);
    setCurrentPage(1);
    setCsvData(null);
    setHasMore(true);

    socket.emit('request-paginated-data', {
      limit: 500,
      skip: 0,
      sortBy: 'Timestamp',
      sortOrder: -1,
    });
  };

  return {
    csvData,
    loading,
    error,
    hasMore,
    totalRecords,
    currentPage,
    loadMoreData,
    refreshData,
  };
};
