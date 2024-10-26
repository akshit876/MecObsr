"use client";
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "react-toastify"; // Assuming you are using react-toastify for alerts

const predefinedPartNos = ["8739760007", "8739760008"]; // Predefined part numbers from the image

const SettingsPage = () => {
  const [partNo, setPartNo] = useState(""); // State to store selected part number
  const [loading, setLoading] = useState(false); // Loading state for API request
  const [initialLoading, setInitialLoading] = useState(true); // Loading state for initial part no fetch

  // Fetch the current part number when the component mounts
  useEffect(() => {
    const fetchCurrentPartNo = async () => {
      try {
        const response = await fetch("/api/config"); // GET request to fetch current part number
        const data = await response.json();
        if (response.ok && data.partNo) {
          setPartNo(data.partNo); // Set the fetched part number in the state
        } else {
          toast.error("Failed to fetch current part number.");
        }
      } catch (error) {
        console.error("Error fetching part number:", error);
        toast.error("An error occurred while fetching the part number.");
      } finally {
        setInitialLoading(false); // Mark initial loading as complete
      }
    };

    fetchCurrentPartNo();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault(); // Prevent default form submission
    if (!partNo) {
      toast.error("Part number is required.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/config", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ partNo }), // Send the selected part number to the API
      });

      const data = await response.json();
      if (response.ok) {
        toast.success("Part number saved successfully!");
      } else {
        toast.error(data.error || "Failed to save part number.");
      }
    } catch (error) {
      console.error("Error saving part number:", error);
      toast.error("An error occurred while saving the part number.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-6 flex justify-center items-center">
      <div className="bg-white shadow-lg rounded-lg p-8 max-w-lg w-full">
        <h1 className="text-2xl font-semibold mb-6">Settings</h1>

        {initialLoading ? (
          <div>Loading...</div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label
                htmlFor="partNo"
                className="block text-sm font-medium text-gray-700"
              >
                Part Number
              </label>
              {/* Plain HTML Select Dropdown */}
              <select
                id="partNo"
                value={partNo}
                onChange={(e) => setPartNo(e.target.value)}
                className="mt-1 block w-full p-2 border border-gray-300 rounded-md"
                required
              >
                <option value="" disabled>
                  Select a part number
                </option>
                {predefinedPartNos.map((part) => (
                  <option key={part} value={part}>
                    {part}
                  </option>
                ))}
              </select>
            </div>

            <Button type="submit" disabled={loading} className="w-full mt-4">
              {loading ? "Saving..." : "Save Part Number"}
            </Button>
          </form>
        )}
      </div>
    </div>
  );
};

export default SettingsPage;
