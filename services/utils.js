import logger from '../logger.js';

export function emitErrorEvent(socket, errorType, errorMessage) {
  if (socket) {
    socket.emit('error', {
      type: errorType,
      message: errorMessage,
    });
  }
  logger.error(`${errorType}: ${errorMessage}`);
}

/** Emit emergency-stop so the UI shows the alarm (same style as part already marked). */
export function emitEmergencyStop(io, message = 'Emergency stop activated') {
  if (io) {
    io.emit('emergency-stop', { message });
    emitErrorEvent(io, 'EMERGENCY_STOP', message);
  }
  logger.warn(`EMERGENCY_STOP: ${message}`);
}
