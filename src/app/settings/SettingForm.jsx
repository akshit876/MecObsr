// components/PortForm.js
"use client";

import { useState, useEffect } from "react";
import { io } from "socket.io-client";
// import { Button } from "@shadcn/ui/button"; // Use the Button component from shadcn
// import { Input } from "@shadcn/ui/input"; // Use the Input component from shadcn
// import { Label } from "@shadcn/ui/label"; // Use the Label component from shadcn
import {
  Card,
  CardContent,
  CardHeader,
  CardFooter,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const socket = io(); // Establish a socket connection

const PortForm = () => {
  const [port, setPort] = useState("");

  // Effect to listen for any confirmation of data being set
  useEffect(() => {
    socket.on("data-set", (response) => {
      if (response.success) {
        alert("Port saved successfully!");
      } else {
        alert(`Failed to save port: ${response.error}`);
      }
    });

    // Cleanup the event listener on component unmount
    return () => {
      socket.off("data-set");
    };
  }, []);

  const handleSave = (e) => {
    e.preventDefault();
    if (!port) {
      alert("Please enter a port value.");
      return;
    }

    // Emit event to save or update port in the backend
    socket.emit("set-data", { key: "port", value: port });
  };

  return (
    <Card className="max-w-md mx-auto mt-10 shadow-lg">
      <CardHeader className="border-b p-4">
        <CardTitle className="text-lg font-semibold text-gray-800">
          Set Port
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4">
        <form onSubmit={handleSave}>
          <div className="mb-4">
            <Label
              htmlFor="port"
              className="block mb-2 text-gray-700 font-medium"
            >
              Port
            </Label>
            <Input
              id="port"
              type="text"
              value={port}
              onChange={(e) => setPort(e.target.value)}
              placeholder="Enter port (e.g., COM4)"
              className="w-full"
              required
            />
          </div>
        </form>
      </CardContent>
      <CardFooter className="border-t p-4">
        <Button
          type="submit"
          onClick={handleSave}
          className="w-full bg-blue-600 text-white hover:bg-blue-700"
        >
          Save
        </Button>
      </CardFooter>
    </Card>
  );
};

export default PortForm;
