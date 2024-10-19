"use client";

import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export function ToastProvider({ children }) {
  return (
    <>
      {children}
      <ToastContainer />
    </>
  );
}
