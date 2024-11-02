'use client';

import { useSelectedPart } from '@/hooks/useSelectedPart';
import React from 'react';
export default function OperatorDashboard() {
  const { selectedPart, clearSelectedPart } = useSelectedPart();

  return (
    <div>
      <h1>Operator Dashboard</h1>
      {selectedPart && (
        <div>
          <h2>Current Part Number: {generatePartNumber(selectedPart.fields)}</h2>
          {/* Rest of your operator dashboard */}
        </div>
      )}
    </div>
  );
}
