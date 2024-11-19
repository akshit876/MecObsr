import { useEffect } from 'react';

export const usePulseSignal = (socket) => {
  useEffect(() => {
    if (!socket) return;

    // Initial pulse on when component mounts
    socket.emit('pulse_on');
    console.log('Pulse ON sent');

    // Handle visibility change
    const handleVisibilityChange = () => {
      if (!socket) return;

      if (document.hidden) {
        socket.emit('pulse_off');
        console.log('Pulse OFF sent (tab hidden)');
      } else {
        socket.emit('pulse_on');
        console.log('Pulse ON sent (tab visible)');
      }
    };

    // Handle page unload
    const handleBeforeUnload = () => {
      socket.emit('pulse_off');
      console.log('Pulse OFF sent (page unload)');
    };

    // Add event listeners
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('beforeunload', handleBeforeUnload);

    // Cleanup function
    return () => {
      socket.emit('pulse_off');
      console.log('Pulse OFF sent (unmount)');

      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [socket]);
};
