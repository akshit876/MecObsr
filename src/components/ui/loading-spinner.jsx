/* eslint-disable react/prop-types */
import { Loader2 } from 'lucide-react';
import React from 'react';
export function LoadingSpinner({ title = 'Loading...' }) {
  return (
    <div className="h-full flex flex-col items-center justify-center">
      <div className="space-y-4 text-center">
        <Loader2 className="h-16 w-16 animate-spin text-primary mx-auto" />
        <h2 className="text-2xl font-semibold text-gray-700 animate-pulse">{title}</h2>
      </div>
    </div>
  );
}
