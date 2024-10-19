/* eslint-disable consistent-return */
import { useSocket } from "@/SocketContext";
import { useState, useEffect } from "react";

export const useCsvData = () => {
  const [csvData, setCsvData] = useState([]);
  const [loading, setLoading] = useState(true); // Add loading state
  const socket = useSocket(); // Get the socket instance from context

  useEffect(() => {
    if (!socket) return; // Ensure the socket is available

    // Function to handle incoming CSV data
    const handleCsvData = (data) => {
      console.log({ data });
      setCsvData(data);
      setLoading(false); // Set loading to false once data is received
    };

    // Request CSV data on component mount
    setLoading(true); // Set loading to true when requesting data
    socket.emit("request-csv-data");

    // Listen for the csv-data event from the server
    socket.on("csv-data", handleCsvData);

    // Cleanup the event listener on component unmount
    return () => {
      socket.off("csv-data", handleCsvData);
    };
  }, [socket]);

  return { csvData, loading }; // Return loading state along with csvData
};
