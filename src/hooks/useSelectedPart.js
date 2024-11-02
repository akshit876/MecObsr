import { useState, useEffect } from 'react';

export function useSelectedPart() {
  const [selectedPart, setSelectedPart] = useState(null);

  useEffect(() => {
    const stored = localStorage.getItem('selectedPartConfig');
    if (stored) {
      setSelectedPart(JSON.parse(stored));
    }
  }, []);

  const clearSelectedPart = () => {
    localStorage.removeItem('selectedPartConfig');
    setSelectedPart(null);
  };

  return { selectedPart, clearSelectedPart };
} 