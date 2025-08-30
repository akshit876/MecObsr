# PLC Control System for Manual Mode

This system provides comprehensive PLC control for manual operations and jog movements using the 1900 series registers.

## 🚀 Quick Start

### 1. Start the PLC Control Server

```bash
npm run server
# or
npm run dev:server
```

### 2. Start the Next.js Frontend

```bash
npm run dev
```

The system will be available at:

- **Frontend**: http://localhost:3000
- **PLC Control Server**: http://localhost:3002

## 🏗️ Architecture

### Backend Services

- **`plcControlService.js`**: Core PLC control logic
- **`socketEventHandler.js`**: Socket event handling and routing
- **`server.js`**: Main server with Socket.IO integration

### Frontend Components

- **`manual-mode/page.js`**: Manual control interface
- **`constants/plcMapping.js`**: PLC register mapping configuration

## 📡 Socket Events

### UI → Backend Events

#### Manual Control Events

```javascript
// Single-shot operations (auto OFF after 1 second)
socket.emit('manual_control', {
  type: 'HMOE',
  register: 1900,
  bit: 0,
  description: 'HMOE Operation',
});

socket.emit('manual_control', {
  type: 'LoGo',
  register: 1900,
  bit: 1,
  description: 'LoGo Operation',
});

socket.emit('manual_control', {
  type: 'CODE',
  register: 1900,
  bit: 2,
  description: 'CODE Operation',
});
// ... etc
```

#### Jog Control Events

```javascript
// Start continuous movement
socket.emit('jog_control', {
  type: 'X_JOG_PLUS',
  action: 'start',
  register: 1901,
  bit: 0,
  description: 'X Axis Jog Forward',
});

// Stop continuous movement
socket.emit('jog_control', {
  type: 'X_JOG_PLUS',
  action: 'stop',
  register: 1901,
  bit: 0,
  description: 'X Axis Jog Forward',
});
```

#### System Control Events

```javascript
// Emergency stop all operations
socket.emit('emergency_stop');

// Get current PLC status
socket.emit('get_plc_status');
```

### Backend → UI Events

#### Status Updates

```javascript
// Manual event started
socket.on('plc_status_update', (data) => {
  if (data.type === 'manual_event_started') {
    console.log(`${data.eventName} activated on Register ${data.register}.${data.bit}`);
  }
});

// Jog event started
socket.on('plc_status_update', (data) => {
  if (data.type === 'jog_event_started') {
    console.log(`${data.eventName} started on Register ${data.register}.${data.bit}`);
  }
});

// Jog event stopped
socket.on('plc_status_update', (data) => {
  if (data.type === 'jog_event_stopped') {
    console.log(
      `${data.eventName} stopped on Register ${data.register}.${data.bit} (Duration: ${data.duration})`,
    );
  }
});
```

#### Response Events

```javascript
// Manual control response
socket.on('manual_control_response', (data) => {
  if (data.success) {
    console.log('Operation successful:', data.message);
    console.log(`Register: ${data.register}.${data.bit}`);
  } else {
    console.error('Operation failed:', data.message);
  }
});

// Jog control response
socket.on('jog_control_response', (data) => {
  if (data.success) {
    console.log('Jog operation successful:', data.message);
    console.log(`Register: ${data.register}.${data.bit}`);
  } else {
    console.error('Jog operation failed:', data.message);
  }
});
```

## 🔌 PLC Register Mapping

### 1900 Series Registers

#### Register 1900 - Main Control Operations

| Bit | Operation            | Description          |
| --- | -------------------- | -------------------- |
| 0   | HMOE                 | HMOE Operation       |
| 1   | LoGo                 | LoGo Operation       |
| 2   | CODE                 | CODE Operation       |
| 3   | CASTING_TRACEABILITY | Casting Traceability |
| 4   | HUMAN_READABLE       | Human Readable       |
| 5   | SCANNER              | Scanner Operation    |
| 6   | SCANNER_TRIGGER      | Scanner Trigger      |
| 7   | MARKON               | Marking On           |
| 8   | LIGHT                | Light Control        |

#### Register 1901 - Jog Controls

| Bit | Operation   | Description         |
| --- | ----------- | ------------------- |
| 0   | X_JOG_PLUS  | X Axis Jog Forward  |
| 1   | X_JOG_MINUS | X Axis Jog Backward |
| 2   | Z_JOG_PLUS  | Z Axis Jog Forward  |
| 3   | Z_JOG_MINUS | Z Axis Jog Backward |

#### Register 1902 - Additional Controls

| Bit | Operation              | Description            |
| --- | ---------------------- | ---------------------- |
| 0   | SERVO_HOME             | Servo Home Position    |
| 1   | SERVO_SCANNER_POSITION | Servo Scanner Position |
| 2   | SERVO_OCR_POSITION     | Servo OCR Position     |
| 3   | SERVO_MARKING_POSITION | Servo Marking Position |
| 4   | WORK_LIGHT             | Work Light Control     |
| 5   | TOWER_LIGHT_RED        | Tower Light Red        |
| 6   | TOWER_LIGHT_GREEN      | Tower Light Green      |
| 7   | TOWER_LIGHT_YELLOW     | Tower Light Yellow     |

#### Register 1903 - System Controls

| Bit | Operation        | Description      |
| --- | ---------------- | ---------------- |
| 0   | EMERGENCY_STOP   | Emergency Stop   |
| 1   | SYSTEM_RESET     | System Reset     |
| 2   | MAINTENANCE_MODE | Maintenance Mode |
| 3   | PRODUCTION_MODE  | Production Mode  |

## ⚡ Behavior Types

### 1. Manual Control Events

- **Behavior**: Turn ON → Wait 1 second → Automatically turn OFF
- **Use Case**: Single-shot operations like solenoid activation, momentary switches
- **Example**: `HMOE`, `LoGo`, `CODE`, etc.

### 2. Jog Control Events

- **Behavior**: Turn ON and keep ON until explicitly stopped
- **Use Case**: Continuous operations like motor jogging, conveyor movement
- **Example**: `X_JOG_PLUS`, `Z_JOG_MINUS`, etc.

## 🛡️ Safety Features

### Emergency Stop

- Immediately stops all active jog events
- Turns OFF all PLC bits in use
- Provides visual feedback on UI
- Logs all stopped operations with register information

### Automatic Cleanup

- Stops all active events during system shutdown
- Prevents stuck operations
- Comprehensive error handling and logging

## 📊 Real-time Monitoring

### Active Operations Display

- Shows currently running jog operations
- Displays operation duration
- Real-time status updates
- Visual indicators for active controls
- Register and bit information displayed on buttons

### Connection Status

- PLC connection status
- Socket connection status
- Total active operations count
- Refresh capability for status updates

## 🔧 Configuration

### Adding New Operations

1. **Update `plcMapping.js`**:

```javascript
// Add to appropriate category
NEW_OPERATION: { register: 1904, bit: 0, description: 'New Operation' }
```

2. **Update UI buttons** in `manual-mode/page.js`
3. **Restart server** to apply changes

### Customizing Register Ranges

- Modify register numbers in `plcMapping.js`
- Ensure no conflicts with existing PLC configuration
- Update documentation accordingly

## 🚨 Troubleshooting

### Common Issues

#### PLC Not Connected

- Check Modbus connection settings
- Verify PLC is powered and accessible
- Check network connectivity

#### Events Not Working

- Verify socket connection status
- Check browser console for errors
- Ensure server is running on port 3002
- Verify register and bit information is being sent correctly

#### Register Conflicts

- Verify register mapping in `plcMapping.js`
- Check for duplicate register/bit combinations
- Ensure registers are within PLC range

### Debug Mode

Enable detailed logging by checking:

- Browser console for frontend events
- Server console for backend operations
- PLC communication logs

## 📝 API Reference

### PLC Control Service Methods

```javascript
// Manual event handling
await plcControlService.handleManualEvent(eventName, register, bit, socket);

// Jog event handling
await plcControlService.handleJogEvent(eventName, action, register, bit, socket);

// Emergency stop
await plcControlService.emergencyStop(socket);

// Get status
const status = plcControlService.getStatus(socket);

// Cleanup
await plcControlService.cleanup();
```

### Socket Event Handler Methods

```javascript
// Get all available event handlers
const handlers = socketEventHandler.getEventHandlers();

// Cleanup
await socketEventHandler.cleanup();
```

## 🔄 Development Workflow

1. **Make changes** to PLC mapping or UI
2. **Restart server** with `npm run server`
3. **Test operations** in manual mode
4. **Monitor logs** for any errors
5. **Verify PLC behavior** matches expected

## 📞 Support

For issues or questions:

1. Check server logs for error messages
2. Verify PLC connection and configuration
3. Test with simple operations first
4. Ensure all dependencies are installed

---

**Note**: This system is designed for industrial use. Always test in a safe environment before deploying to production.
