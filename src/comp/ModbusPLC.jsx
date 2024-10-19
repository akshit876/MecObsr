/* eslint-disable no-nested-ternary */
"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useModbus } from "../../hooks/useModbus";
import { useSocket } from "@/SocketContext";
import {
  MODBUS_ADDRESSES,
  MODBUS_BITS,
  SECTION_LABELS,
  MANUAL_RUN_OPERATIONS,
} from "@/constants/modbus";

const sections = [
  {
    title: "Input",
    readStart: MODBUS_ADDRESSES.INPUT_START,
    readBits: MODBUS_BITS.INPUT,
    labels: SECTION_LABELS.INPUT,
  },
  {
    title: "Output",
    readStart: MODBUS_ADDRESSES.OUTPUT_START,
    readBits: MODBUS_BITS.OUTPUT,
    labels: SECTION_LABELS.OUTPUT,
  },
  {
    title: "Software and PLC Input Status",
    readStart: MODBUS_ADDRESSES.SOFTWARE_PLC_INPUT_START,
    readBits: MODBUS_BITS.SOFTWARE_PLC_INPUT,
    labels: SECTION_LABELS.SOFTWARE_PLC_INPUT,
  },
  {
    title: "Software and PLC Output Status",
    readStart: MODBUS_ADDRESSES.SOFTWARE_PLC_OUTPUT_START,
    readBits: MODBUS_BITS.SOFTWARE_PLC_OUTPUT,
    labels: SECTION_LABELS.SOFTWARE_PLC_OUTPUT,
  },
];

const ModbusSection = ({ section }) => {
  const { readRegisters, refreshReadRegisters } = useModbus({
    readRange: { register: section.readStart, bits: section.readBits },
    readOnly: true,
  });

  return (
    <Card className="shadow-lg">
      <CardHeader className="bg-gray-100">
        <CardTitle className="text-lg font-semibold">{section.title}</CardTitle>
      </CardHeader>
      <CardContent className="p-4">
        <div className="space-y-2">
          {readRegisters?.bits &&
            Object.entries(readRegisters.bits).map(([k, v], index) => (
              <div
                key={`read-${index}`}
                className="flex items-center space-x-2"
              >
                <Label className="w-1/2 text-sm">{section.labels[index]}</Label>
                <Input
                  type="text"
                  value={Number(v)}
                  readOnly
                  className="w-1/2 text-center font-bold"
                  style={{
                    backgroundColor:
                      Number(v) === 0
                        ? "#FCA5A5"
                        : Number(v) === 1
                          ? "#86EFAC"
                          : "white",
                    color:
                      Number(v) === 0 || Number(v) === 1 ? "white" : "black",
                  }}
                />
              </div>
            ))}
        </div>
        <Button onClick={refreshReadRegisters} className="mt-4 w-full">
          Refresh
        </Button>
      </CardContent>
    </Card>
  );
};

const ModbusUI = () => {
  const socket = useSocket();

  const handleManualRun = (operation) => {
    if (socket) {
      socket.emit("manual-run", operation);
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-8">
      <h1 className="text-3xl font-bold text-center mb-8">
        Modbus PLC Control Panel
      </h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {sections.map((section, index) => (
          <ModbusSection key={`${section.title}`} section={section} />
        ))}
      </div>
      <div className="mt-8">
        <h2 className="text-2xl font-bold text-center mb-4">
          Manual Operations
        </h2>
        <div className="flex flex-wrap justify-center gap-4">
          {MANUAL_RUN_OPERATIONS.map((op, index) => (
            <Button
              key={index}
              onClick={() => handleManualRun(op.operation)}
              className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded"
            >
              {op.name}
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ModbusUI;
