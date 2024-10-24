/* eslint-disable consistent-return */
import { useSocket } from "@/SocketContext";
import { useState, useEffect } from "react";
import { useProtectedRoute } from "./useProtectedRoute";

export const useCsvData = () => {
  const [csvData, setCsvData] = useState([]);
  const [loading, setLoading] = useState(true); // Add loading state
  const socket = useSocket(); // Get the socket instance from context

  const { session, status } = useProtectedRoute();
  console.log("a", { session });
  useEffect(() => {
    if (!socket || !session) return; // Ensure the socket is available

    // Function to handle incoming CSV data
    const handleCsvData = (data) => {
      console.log({ data });
      setCsvData(data);
      setLoading(false); // Set loading to false once data is received
    };

    // Request CSV data on component mount
    setLoading(true); // Set loading to true when requesting data
    console.log({ session });
    socket.emit("request-csv-data", {
      userId: session?.user?.id, // Assuming session contains user information
      userName: session?.user?.email, // You can add any other details as required
      userRole: session?.user?.role,
    });

    // Listen for the csv-data event from the server
    socket.on("csv-data", handleCsvData);

    // Cleanup the event listener on component unmount
    return () => {
      socket.off("csv-data", handleCsvData);
    };
  }, [socket]);

  return { csvData, loading }; // Return loading state along with csvData
};
