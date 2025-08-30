import { writeBit, connect } from './modbus.js';
import logger from '../logger.js';
import { emitErrorEvent } from './utils.js';

class PLCControlService {
  constructor() {
    this.activeJogEvents = new Map(); // Track active jog events
    this.isConnected = false;
    this.initialize();
  }

  async initialize() {
    try {
      await connect();
      this.isConnected = true;
      logger.info('PLC Control Service initialized successfully');
    } catch (error) {
      logger.error(`Failed to initialize PLC Control Service: ${error.message}`);
      this.isConnected = false;
    }
  }

  /**
   * Handle manual control events (auto OFF after 1 second)
   * @param {string} eventName - Name of the event
   * @param {number} register - PLC register address (1900 series)
   * @param {number} bit - Bit position in the register
   * @param {Object} socket - Socket instance for error reporting
   */
  async handleManualEvent(eventName, register, bit, socket) {
    if (!this.isConnected) {
      const errorMessage = 'PLC not connected';
      emitErrorEvent(socket, 'PLC_NOT_CONNECTED', errorMessage);
      throw new Error(errorMessage);
    }

    try {
      // Turn ON the bit
      await writeBit(register, bit, 1);
      logger.info(`Manual event ${eventName} activated: Register ${register}.${bit} = ON`);

      // Automatically turn OFF after 1 second
      setTimeout(async () => {
        try {
          await writeBit(register, bit, 0);
          logger.info(`Manual event ${eventName} auto-reset: Register ${register}.${bit} = OFF`);

          // Emit status update to UI
          if (socket) {
            socket.emit('plc_status_update', {
              type: 'manual_event_completed',
              eventName,
              register,
              bit,
              status: 'completed',
              timestamp: new Date().toISOString(),
            });
          }
        } catch (resetError) {
          const errorMessage = `Error auto-resetting manual event ${eventName}: ${resetError.message}`;
          emitErrorEvent(socket, 'MANUAL_EVENT_RESET_ERROR', errorMessage);
          logger.error(errorMessage);
        }
      }, 1000);

      // Emit immediate status update
      if (socket) {
        socket.emit('plc_status_update', {
          type: 'manual_event_started',
          eventName,
          register,
          bit,
          status: 'active',
          timestamp: new Date().toISOString(),
        });
      }

      return {
        success: true,
        message: `Manual event ${eventName} executed successfully`,
        register,
        bit,
        duration: '1 second',
      };
    } catch (error) {
      const errorMessage = `Error executing manual event ${eventName}: ${error.message}`;
      emitErrorEvent(socket, 'MANUAL_EVENT_EXECUTION_ERROR', errorMessage);
      logger.error(errorMessage);
      throw error;
    }
  }

  /**
   * Handle jog control events (keep ON until explicitly stopped)
   * @param {string} eventName - Name of the event
   * @param {string} action - 'start' or 'stop'
   * @param {number} register - PLC register address (1900 series)
   * @param {number} bit - Bit position in the register
   * @param {Object} socket - Socket instance for error reporting
   */
  async handleJogEvent(eventName, action, register, bit, socket) {
    if (!this.isConnected) {
      const errorMessage = 'PLC not connected';
      emitErrorEvent(socket, 'PLC_NOT_CONNECTED', errorMessage);
      throw new Error(errorMessage);
    }

    try {
      if (action === 'start') {
        // Start jog operation - turn ON the bit
        await writeBit(register, bit, 1);

        // Store the active jog event
        this.activeJogEvents.set(eventName, {
          register,
          bit,
          startTime: new Date(),
          socket,
        });

        logger.info(`Jog event ${eventName} started: Register ${register}.${bit} = ON`);

        // Emit status update
        if (socket) {
          socket.emit('plc_status_update', {
            type: 'jog_event_started',
            eventName,
            register,
            bit,
            status: 'active',
            startTime: new Date().toISOString(),
            timestamp: new Date().toISOString(),
          });
        }

        return {
          success: true,
          message: `Jog event ${eventName} started successfully`,
          register,
          bit,
          status: 'active',
        };
      } else if (action === 'stop') {
        // Stop jog operation - turn OFF the bit
        await writeBit(register, bit, 0);

        // Remove from active events
        const jogEvent = this.activeJogEvents.get(eventName);
        if (jogEvent) {
          this.activeJogEvents.delete(eventName);

          const duration = Date.now() - jogEvent.startTime.getTime();
          logger.info(
            `Jog event ${eventName} stopped: Register ${register}.${bit} = OFF (Duration: ${duration}ms)`,
          );

          // Emit status update
          if (socket) {
            socket.emit('plc_status_update', {
              type: 'jog_event_stopped',
              eventName,
              register,
              bit,
              status: 'stopped',
              duration: `${duration}ms`,
              timestamp: new Date().toISOString(),
            });
          }

          return {
            success: true,
            message: `Jog event ${eventName} stopped successfully`,
            register,
            bit,
            status: 'stopped',
            duration: `${duration}ms`,
          };
        } else {
          return {
            success: false,
            message: `Jog event ${eventName} was not active`,
          };
        }
      }
    } catch (error) {
      const errorMessage = `Error handling jog event ${eventName}: ${error.message}`;
      emitErrorEvent(socket, 'JOG_EVENT_ERROR', errorMessage);
      logger.error(errorMessage);
      throw error;
    }
  }

  /**
   * Emergency stop - stop all active jog events
   * @param {Object} socket - Socket instance for error reporting
   */
  async emergencyStop(socket) {
    if (!this.isConnected) {
      const errorMessage = 'PLC not connected';
      emitErrorEvent(socket, 'PLC_NOT_CONNECTED', errorMessage);
      throw new Error(errorMessage);
    }

    try {
      const stoppedEvents = [];

      // Stop all active jog events
      for (const [eventName, jogEvent] of this.activeJogEvents.entries()) {
        try {
          await writeBit(jogEvent.register, jogEvent.bit, 0);
          this.activeJogEvents.delete(eventName);
          stoppedEvents.push({
            eventName,
            register: jogEvent.register,
            bit: jogEvent.bit,
          });

          logger.info(`Emergency stop: Jog event ${eventName} stopped`);
        } catch (error) {
          logger.error(
            `Error stopping jog event ${eventName} during emergency stop: ${error.message}`,
          );
        }
      }

      logger.info(`Emergency stop completed. Stopped ${stoppedEvents.length} jog events`);

      // Emit emergency stop status
      if (socket) {
        socket.emit('plc_status_update', {
          type: 'emergency_stop',
          status: 'completed',
          stoppedEvents,
          timestamp: new Date().toISOString(),
        });
      }

      return {
        success: true,
        message: `Emergency stop completed. Stopped ${stoppedEvents.length} jog events`,
        stoppedEvents,
      };
    } catch (error) {
      const errorMessage = `Error during emergency stop: ${error.message}`;
      emitErrorEvent(socket, 'EMERGENCY_STOP_ERROR', errorMessage);
      logger.error(errorMessage);
      throw error;
    }
  }

  /**
   * Get current PLC status
   * @param {Object} socket - Socket instance for status reporting
   */
  getStatus(socket) {
    const status = {
      isConnected: this.isConnected,
      activeJogEvents: Array.from(this.activeJogEvents.entries()).map(([eventName, event]) => ({
        eventName,
        register: event.register,
        bit: event.bit,
        startTime: event.startTime.toISOString(),
        duration: `${Date.now() - event.startTime.getTime()}ms`,
      })),
      totalActiveEvents: this.activeJogEvents.size,
      timestamp: new Date().toISOString(),
    };

    // Emit status to UI
    if (socket) {
      socket.emit('plc_status_update', {
        type: 'status_request',
        ...status,
      });
    }

    return status;
  }

  /**
   * Cleanup method to stop all active events
   */
  async cleanup() {
    try {
      // Stop all active jog events
      for (const [eventName, jogEvent] of this.activeJogEvents.entries()) {
        try {
          await writeBit(jogEvent.register, jogEvent.bit, 0);
          logger.info(`Cleanup: Stopped jog event ${eventName}`);
        } catch (error) {
          logger.error(`Error stopping jog event ${eventName} during cleanup: ${error.message}`);
        }
      }

      this.activeJogEvents.clear();
      logger.info('PLC Control Service cleanup completed');
    } catch (error) {
      logger.error(`Error during PLC Control Service cleanup: ${error.message}`);
    }
  }
}

// Create singleton instance
const plcControlService = new PLCControlService();

export default plcControlService;
