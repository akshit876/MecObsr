'use client';

import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

export function ToastProvider({ children }) {
  return (
    <>
      {children}
      <ToastContainer position="top-right" autoClose={5000} />
    </>
  );
}
