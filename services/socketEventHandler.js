import plcControlService from './plcControlService.js';
import { getPLCMapping, isJogControl, isManualControl } from '../src/constants/plcMapping.js';
import logger from '../logger.js';

class SocketEventHandler {
  constructor() {
    this.setupEventHandlers();
  }

  setupEventHandlers() {
    // This will be called when the socket server is ready
    // The actual event binding will happen in the main server file
  }

  /**
   * Handle manual control events from UI
   * @param {Object} socket - Socket instance
   * @param {Object} data - Event data from UI
   */
  async handleManualControl(socket, data) {
    try {
      const { type: eventName, register, bit, description } = data;

      if (!eventName) {
        socket.emit('error', { message: 'Event type is required' });
        return;
      }

      if (!register || bit === undefined) {
        socket.emit('error', { message: 'Register and bit are required' });
        return;
      }

      // Validate that this is actually a manual control (not a jog control)
      if (isJogControl(eventName)) {
        socket.emit('error', {
          message: `${eventName} is a jog control, use jog_control event instead`,
        });
        return;
      }

      logger.info(
        `Processing manual control event: ${eventName} -> Register ${register}.${bit} (${description || 'No description'})`,
      );

      // Execute the manual control event using provided register and bit
      const result = await plcControlService.handleManualEvent(eventName, register, bit, socket);

      // Send success response back to UI
      socket.emit('manual_control_response', {
        success: true,
        eventName,
        message: result.message,
        register,
        bit,
        description,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      logger.error(`Error handling manual control event: ${error.message}`);

      // Send error response back to UI
      socket.emit('manual_control_response', {
        success: false,
        eventName: data.type,
        message: `Error: ${error.message}`,
        timestamp: new Date().toISOString(),
      });
    }
  }

  /**
   * Handle jog control events from UI
   * @param {Object} socket - Socket instance
   * @param {Object} data - Event data from UI
   */
  async handleJogControl(socket, data) {
    try {
      const { type: eventName, action, register, bit, description } = data;

      if (!eventName || !action) {
        socket.emit('error', { message: 'Event type and action are required' });
        return;
      }

      if (!['start', 'stop'].includes(action)) {
        socket.emit('error', { message: 'Action must be "start" or "stop"' });
        return;
      }

      if (!register || bit === undefined) {
        socket.emit('error', { message: 'Register and bit are required' });
        return;
      }

      // Validate that this is actually a jog control
      if (!isJogControl(eventName)) {
        socket.emit('error', {
          message: `${eventName} is not a jog control, use manual_control event instead`,
        });
        return;
      }

      logger.info(
        `Processing jog control event: ${eventName} ${action} -> Register ${register}.${bit} (${description || 'No description'})`,
      );

      // Execute the jog control event using provided register and bit
      const result = await plcControlService.handleJogEvent(
        eventName,
        action,
        register,
        bit,
        socket,
      );

      // Send success response back to UI
      socket.emit('jog_control_response', {
        success: true,
        eventName,
        action,
        message: result.message,
        register,
        bit,
        description,
        status: result.status,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      logger.error(`Error handling jog control event: ${error.message}`);

      // Send error response back to UI
      socket.emit('jog_control_response', {
        success: false,
        eventName: data.type,
        action: data.action,
        message: `Error: ${error.message}`,
        timestamp: new Date().toISOString(),
      });
    }
  }

  /**
   * Handle emergency stop events from UI
   * @param {Object} socket - Socket instance
   * @param {Object} data - Event data from UI
   */
  async handleEmergencyStop(socket, data) {
    try {
      logger.info('Processing emergency stop request');

      // Execute emergency stop
      const result = await plcControlService.emergencyStop(socket);

      // Send success response back to UI
      socket.emit('emergency_stop_response', {
        success: true,
        message: result.message,
        stoppedEvents: result.stoppedEvents,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      logger.error(`Error handling emergency stop: ${error.message}`);

      // Send error response back to UI
      socket.emit('emergency_stop_response', {
        success: false,
        message: `Error: ${error.message}`,
        timestamp: new Date().toISOString(),
      });
    }
  }

  /**
   * Handle PLC status request from UI
   * @param {Object} socket - Socket instance
   * @param {Object} data - Event data from UI
   */
  async handleGetPLCStatus(socket, data) {
    try {
      logger.info('Processing PLC status request');

      // Get current PLC status
      const status = plcControlService.getStatus(socket);

      // Send status response back to UI
      socket.emit('plc_status_response', {
        success: true,
        status,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      logger.error(`Error getting PLC status: ${error.message}`);

      // Send error response back to UI
      socket.emit('plc_status_response', {
        success: false,
        message: `Error: ${error.message}`,
        timestamp: new Date().toISOString(),
      });
    }
  }

  /**
   * Get all available event handlers
   * @returns {Object} Object containing all event handler methods
   */
  getEventHandlers() {
    return {
      manual_control: this.handleManualControl.bind(this),
      jog_control: this.handleJogControl.bind(this),
      emergency_stop: this.handleEmergencyStop.bind(this),
      get_plc_status: this.handleGetPLCStatus.bind(this),
    };
  }

  /**
   * Cleanup method
   */
  async cleanup() {
    try {
      await plcControlService.cleanup();
      logger.info('Socket event handler cleanup completed');
    } catch (error) {
      logger.error(`Error during socket event handler cleanup: ${error.message}`);
    }
  }
}

// Create singleton instance
const socketEventHandler = new SocketEventHandler();

export default socketEventHandler;
