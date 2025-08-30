import { createServer } from 'http';
import { Server } from 'socket.io';
import next from 'next';
import socketEventHandler from './services/socketEventHandler.js';
import logger from './logger.js';

const dev = process.env.NODE_ENV !== 'production';
const hostname = 'localhost';
const port = 3002;

// Prepare Next.js app
const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app
  .prepare()
  .then(() => {
    // Create HTTP server
    const server = createServer(async (req, res) => {
      try {
        await handle(req, res);
      } catch (err) {
        console.error(err);
        res.statusCode = 500;
        res.end('Internal Server Error');
      }
    });

    // Create Socket.IO server
    const io = new Server(server, {
      cors: {
        origin: ['http://localhost:3000', 'http://localhost:3001'],
        methods: ['GET', 'POST'],
        credentials: true,
      },
    });

    // Socket connection handling
    io.on('connection', (socket) => {
      logger.info(`Client connected: ${socket.id}`);

      // Get event handlers from socketEventHandler service
      const eventHandlers = socketEventHandler.getEventHandlers();

      // Bind all event handlers to this socket
      Object.entries(eventHandlers).forEach(([eventName, handler]) => {
        socket.on(eventName, async (data) => {
          try {
            await handler(socket, data);
          } catch (error) {
            logger.error(`Error in event handler ${eventName}: ${error.message}`);
            socket.emit('error', {
              message: `Internal server error: ${error.message}`,
              event: eventName,
            });
          }
        });
      });

      // Handle disconnection
      socket.on('disconnect', () => {
        logger.info(`Client disconnected: ${socket.id}`);
      });

      // Handle errors
      socket.on('error', (error) => {
        logger.error(`Socket error from ${socket.id}: ${error.message}`);
      });

      // Send welcome message
      socket.emit('connected', {
        message: 'Connected to PLC Control Server',
        timestamp: new Date().toISOString(),
        availableEvents: Object.keys(eventHandlers),
      });
    });

    // Graceful shutdown handling
    const gracefulShutdown = async (signal) => {
      logger.info(`Received ${signal}. Starting graceful shutdown...`);

      try {
        // Cleanup socket event handler
        await socketEventHandler.cleanup();

        // Close socket server
        io.close(() => {
          logger.info('Socket.IO server closed');

          // Close HTTP server
          server.close(() => {
            logger.info('HTTP server closed');
            process.exit(0);
          });
        });
      } catch (error) {
        logger.error(`Error during graceful shutdown: ${error.message}`);
        process.exit(1);
      }
    };

    // Listen for shutdown signals
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

    // Start server
    server.listen(port, () => {
      logger.info(`🚀 PLC Control Server running on port ${port}`);
      logger.info(`📡 Socket.IO server ready for connections`);
      logger.info(`🌐 Next.js app ready on http://${hostname}:${port}`);
      logger.info(
        `📋 Available events: ${Object.keys(socketEventHandler.getEventHandlers()).join(', ')}`,
      );
    });
  })
  .catch((err) => {
    console.error('Error starting server:', err);
    process.exit(1);
  });
