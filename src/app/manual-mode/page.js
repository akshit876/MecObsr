/* eslint-disable consistent-return */
"use client";
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useSocket } from "@/SocketContext";

const ManualMode = () => {
  const [buttonStates, setButtonStates] = useState({});
  const socket = useSocket();

  useEffect(() => {
    // if (socket) {
    //   socket.on("button-state-update", (data) => {
    //     setButtonStates((prevStates) => ({ ...prevStates, ...data }));
    //   });
    // }

    return () => {
      if (socket) {
        socket.off("manual-run");
      }
    };
  }, [socket]);

  const handleButtonClick = (buttonId) => {
    if (socket) {
      const operations = {
        "D1414.B0": "markingStart",
        "D1414.B1": "scannerTrigger",
        "D1414.B2": "ocrTrigger",
        "D1414.B3": "workLight",
        "D1414.B4": "servoHomeposition",
        "D1414.B5": "servoscannerposition",
        "D1414.B6": "servoocrposition",
        "D1414.B7": "servomarkposition",
        "D1414.B8": "jogFwd",
        "D1414.B9": "jogRev",
      };

      const operation = operations[buttonId] || buttonId; // Get the operation based on buttonId
      socket.emit("manual-run", operation);
    }

    // For JOG FWD and JOG REV, we'll simulate the "on till pressing" behavior
    if (buttonId === "D1414.B8" || buttonId === "D1414.B9") {
      setButtonStates((prevStates) => ({ ...prevStates, [buttonId]: true }));

      const timeoutId = setTimeout(() => {
        setButtonStates((prevStates) => ({ ...prevStates, [buttonId]: false }));
      }, 200); // 200ms to simulate "200 miles per second"

      return () => clearTimeout(timeoutId);
    }
  };

  const buttons = [
    { id: "D1414.B4", label: "HOME POSITION" },
    { id: "D1414.B2", label: "OCR TRIGGER" },
    { id: "D1414.B5", label: "SCANNER POSITION" },
    { id: "D1414.B0", label: "MARKING START" },
    { id: "D1414.B6", label: "OCR POSITION" },
    { id: "D1414.B1", label: "SCANNER TRIGGER" },
    { id: "D1414.B7", label: "MARKING POSITION" },
    { id: "D1414.B3", label: "LIGHT" },
    { id: "D1414.B8", label: "JOG FWD" },
    { id: "D1414.B9", label: "JOG REV" },
  ];

  return (
    <Card className="w-full max-w-4xl bg-black text-white">
      <CardHeader>
        <CardTitle className="text-3xl font-bold text-center text-yellow-300">
          MANUAL MODE
        </CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-3 gap-4">
        {buttons.map((button) => (
          <Button
            key={button.id}
            className={`h-20 text-lg font-semibold ${
              buttonStates[button.id] ? "bg-purple-600" : "bg-purple-300"
            } text-black border-2 border-green-500 hover:bg-purple-400`}
            onMouseDown={() => handleButtonClick(button.id)}
            onMouseUp={() => {
              if (button.id === "D1414.B8" || button.id === "D1414.B9") {
                setButtonStates((prevStates) => ({
                  ...prevStates,
                  [button.id]: false,
                }));
              }
            }}
          >
            {button.label}
            <div className="text-xs mt-1">{button.id}</div>
          </Button>
        ))}
      </CardContent>
    </Card>
  );
};

export default ManualMode;
