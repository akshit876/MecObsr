"use client";
import { useSocket } from "@/SocketContext";
import React, { useState, useEffect, useRef } from "react";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const ServoSettings = () => {
  const [settings, setSettings] = useState({
    homePosition: { position: "234.56", speed: "1000" },
    scannerPosition: { position: "234.56", speed: "1000" },
    ocrPosition: { position: "234.56", speed: "1000" },
    markPosition: { position: "234.56", speed: "1000" },
    fwdEndLimit: "234.56",
    revEndLimit: "234.56",
  });

  const [loading, setLoading] = useState({
    servoHome: false,
    jogFwd: false,
    jogRev: false,
    servohomeposition: false,
    servoscannerposition: false,
    servoocrposition: false,
    servomarkposition: false,
  });
  const inputRefs = useRef({}); // Create refs for input elements
  const socket = useSocket();

  useEffect(() => {
    if (socket) {
      //   socket.on("servo-settings-update", (data) => {
      //     setSettings((prevSettings) => ({ ...prevSettings, ...data }));
      //   });
      //   socket.on("servo-setting-change-response", (response) => {
      //     setLoading((prev) => ({ ...prev, [response.key]: false }));
      //     if (response.success) {
      //       toast.success("Setting updated successfully!");
      //     } else {
      //       toast.error("Failed to update setting. Please try again.");
      //     }
      //   });
      //   socket.on("manual-run-response", (response) => {
      //     setLoading((prev) => ({ ...prev, [response.operation]: false }));
      //     if (response.success) {
      //       toast.success(
      //         `Operation ${response.operation} completed successfully`
      //       );
      //     } else {
      //       toast.error(`Failed to execute operation ${response.operation}`);
      //     }
      //   });
    }
    return () => {
      if (socket) {
        socket.off("servo-settings-update");
        socket.off("servo-setting-change-response");
        socket.off("manual-run-response");
        socket.off("servo-setting-change");
      }
    };
  }, [socket]);

  const validateInput = (value, isPosition) => {
    const numValue = parseFloat(value);
    if (isPosition) {
      return numValue >= 1.0 && numValue <= 400.0;
    } else {
      return numValue >= 0 && numValue <= 2000;
    }
  };

  const handleInputBlur = (key, subKey) => {
    const value = inputRefs.current[key][subKey].value;
    const isPosition =
      subKey === "position" || key === "fwdEndLimit" || key === "revEndLimit";
    if (validateInput(value, isPosition)) {
      setSettings((prev) => ({
        ...prev,
        [key]: subKey ? { ...prev[key], [subKey]: value } : value,
      }));
      if (socket) {
        setLoading((prev) => ({ ...prev, [key]: true }));
        console.log({
          setting: key,
          value: subKey ? { [subKey]: value } : value,
        });
        socket.emit("servo-setting-change", {
          setting: key,
          value: subKey ? { [subKey]: value } : value,
        });
      }
    } else {
      toast.error(
        `Invalid input. ${
          isPosition
            ? "Position must be between 1.00 and 400.00"
            : "Speed must be between 0 and 2000"
        }`
      );
      // Revert the input value to the original settings value if validation fails
      if (inputRefs.current[key] && inputRefs.current[key][subKey]) {
        inputRefs.current[key][subKey].value = settings[key][subKey];
      }
    }
  };

  const handleButtonClick = (operation) => {
    if (socket) {
      setLoading((prev) => ({ ...prev, [operation]: true }));
      socket.emit("manual-run", operation);
      setTimeout(() => {
        setLoading((prev) => ({ ...prev, [operation]: false }));
      }, 200);
    }
  };

  const handleInputKeyDown = (e, key, subKey) => {
    if (e.key === "Enter") {
      handleInputBlur(key, subKey);
    }
  };

  const InputValue = ({
    value,
    register,
    onBlur,
    onKeyDown,
    inputKey,
    subKey,
  }) => (
    <div className="relative bg-black border border-green-500 w-32 h-12 rounded-md overflow-hidden">
      <input
        type="text"
        defaultValue={value}
        ref={(el) => {
          if (!inputRefs.current[inputKey]) {
            inputRefs.current[inputKey] = {};
          }
          inputRefs.current[inputKey][subKey] = el;
        }}
        onBlur={() => onBlur(inputKey, subKey)}
        onKeyDown={(e) => onKeyDown(e, inputKey, subKey)} // Handle key down events
        className="w-full h-full bg-transparent text-green-400 font-bold text-2xl px-2 text-right focus:outline-none focus:ring-2 focus:ring-green-500"
      />
      <div className="absolute bottom-0 left-1 text-[10px] text-white">
        {register}
      </div>
    </div>
  );

  const PositionButton = ({
    label,
    register,
    operation,
    color = "bg-purple-400",
  }) => (
    <button
      className={`${color} text-black border border-green-500 rounded-md h-14 w-36 text-sm font-semibold hover:opacity-90 transition-opacity flex flex-col justify-center items-center relative`}
      onClick={() => handleButtonClick(operation)}
      disabled={loading[operation]}
    >
      {loading[operation] ? (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-black"></div>
        </div>
      ) : (
        <>
          {label.split("\n").map((text, i) => (
            <div key={i}>{text}</div>
          ))}
          <span className="text-[10px]">{register}</span>
        </>
      )}
    </button>
  );

  return (
    <div className="min-h-screen bg-black text-white p-8 flex justify-center items-center">
      <div className="w-[1000px]">
        <h1 className="text-4xl font-bold text-center text-white mb-8">
          SERVO SETTINGS
        </h1>

        <div className="space-y-6">
          <div className="flex items-center mb-2">
            <div className="w-48"></div>
            <div className="flex space-x-4 items-center">
              <span className="text-sm font-bold text-white w-32 text-center">
                POSITION/MM
              </span>
              <span className="text-sm font-bold text-white w-32 text-center">
                SPEED/RPM
              </span>
            </div>
          </div>

          {["HOME", "SCANNER", "OCR", "MARK"].map((position, index) => (
            <div key={position} className="flex items-center">
              <span className="text-lg font-bold w-48 text-white">
                {position} POSITION
              </span>
              <div className="flex space-x-4 items-center">
                <InputValue
                  value={settings[`${position.toLowerCase()}Position`].position}
                  register={`D55${index}`}
                  inputKey={`${position.toLowerCase()}Position`}
                  subKey="position"
                  onBlur={handleInputBlur}
                  onKeyDown={handleInputKeyDown} // Pass key down handler
                />
                <InputValue
                  value={settings[`${position.toLowerCase()}Position`].speed}
                  register={`D56${index}`}
                  inputKey={`${position.toLowerCase()}Position`}
                  subKey="speed"
                  onBlur={handleInputBlur}
                  onKeyDown={handleInputKeyDown} // Pass key down handler
                />
                <div className="w-4"></div>
                <PositionButton
                  label={`${position}\nPOSITION`}
                  register={`D1414.B${index + 4}`}
                  operation={`servo${position.toLowerCase()}position`}
                />
              </div>
            </div>
          ))}

          <div className="flex items-center">
            <span className="text-lg font-bold w-48 text-white">
              FWD END LIMIT
            </span>
            <div className="flex space-x-4 items-center">
              <InputValue
                value={settings.fwdEndLimit}
                register="D574"
                inputKey="fwdEndLimit"
                subKey={null}
                onBlur={handleInputBlur}
                onKeyDown={handleInputKeyDown} // Pass key down handler
              />
              <PositionButton
                label="JOG FWD"
                register="D1414.B8"
                operation="jogFwd"
              />
            </div>
          </div>

          <div className="flex items-center">
            <span className="text-lg font-bold w-48 text-white">
              REV END LIMIT
            </span>
            <div className="flex space-x-4 items-center">
              <InputValue
                value={settings.revEndLimit}
                register="D578"
                inputKey="revEndLimit"
                subKey={null}
                onBlur={handleInputBlur}
                onKeyDown={handleInputKeyDown} // Pass key down handler
              />
              <PositionButton
                label="JOG REV"
                register="D1414.B9"
                operation="jogRev"
              />
              <PositionButton
                label="SERVO HOME"
                register="D1414.B10"
                color="bg-red-400"
                operation="servoHome"
              />
            </div>
          </div>
        </div>
      </div>
      <ToastContainer position="bottom-right" theme="dark" />
    </div>
  );
};

export default ServoSettings;
