// PLC Register Mapping for Manual Mode Controls
// All operations use the 1900 series registers for consistency

export const PLC_MAPPING = {
  // Main Control Operations (Manual Events - Auto OFF after 1 second)
  MANUAL_CONTROLS: {
    HOME: { register: 1900, bit: 0, description: 'HOME Operation' },
    LOGO: { register: 1900, bit: 1, description: 'LOGO Operation' },
    CODE: { register: 1900, bit: 2, description: 'CODE Operation' },
    CASTING_TRACEABILITY: { register: 1900, bit: 3, description: 'Casting Traceability' },
    HUMAN_READABLE: { register: 1900, bit: 4, description: 'Human Readable' },
    SCANNER: { register: 1900, bit: 5, description: 'Scanner Operation' },
    SCANNER_TRIGGER: { register: 1900, bit: 6, description: 'Scanner Trigger' },
    MARKON: { register: 1900, bit: 7, description: 'Marking On' },
    LIGHT: { register: 1900, bit: 8, description: 'Light Control' },
  },

  // Jog Controls (Keep ON until explicitly stopped)
  JOG_CONTROLS: {
    X_JOG_PLUS: { register: 1901, bit: 0, description: 'X Axis Jog Forward' },
    X_JOG_MINUS: { register: 1901, bit: 1, description: 'X Axis Jog Backward' },
    Z_JOG_PLUS: { register: 1901, bit: 2, description: 'Z Axis Jog Forward' },
    Z_JOG_MINUS: { register: 1901, bit: 3, description: 'Z Axis Jog Backward' },
  },

  // Additional Control Operations (Manual Events - Auto OFF after 1 second)
  //   ADDITIONAL_CONTROLS: {
  //     SERVO_HOME: { register: 1902, bit: 0, description: 'Servo Home Position' },
  //     SERVO_SCANNER_POSITION: { register: 1902, bit: 1, description: 'Servo Scanner Position' },
  //     SERVO_OCR_POSITION: { register: 1902, bit: 2, description: 'Servo OCR Position' },
  //     SERVO_MARKING_POSITION: { register: 1902, bit: 3, description: 'Servo Marking Position' },
  //     WORK_LIGHT: { register: 1902, bit: 4, description: 'Work Light Control' },
  //     TOWER_LIGHT_RED: { register: 1902, bit: 5, description: 'Tower Light Red' },
  //     TOWER_LIGHT_GREEN: { register: 1902, bit: 6, description: 'Tower Light Green' },
  //     TOWER_LIGHT_YELLOW: { register: 1902, bit: 7, description: 'Tower Light Yellow' },
  //   },

  //   // System Control Operations (Manual Events - Auto OFF after 1 second)
  //   SYSTEM_CONTROLS: {
  //     EMERGENCY_STOP: { register: 1903, bit: 0, description: 'Emergency Stop' },
  //     SYSTEM_RESET: { register: 1903, bit: 1, description: 'System Reset' },
  //     MAINTENANCE_MODE: { register: 1903, bit: 2, description: 'Maintenance Mode' },
  //     PRODUCTION_MODE: { register: 1903, bit: 3, description: 'Production Mode' },
  //   },
};

// Helper function to get PLC mapping for an event
export const getPLCMapping = (eventName) => {
  // Check in all control categories
  for (const category of Object.values(PLC_MAPPING)) {
    if (category[eventName]) {
      return category[eventName];
    }
  }
  return null;
};

// Helper function to get all available events
export const getAllEvents = () => {
  const events = {};

  for (const [categoryName, category] of Object.entries(PLC_MAPPING)) {
    for (const [eventName, mapping] of Object.entries(category)) {
      events[eventName] = {
        ...mapping,
        category: categoryName,
      };
    }
  }

  return events;
};

// Helper function to check if an event is a jog control
export const isJogControl = (eventName) => {
  return eventName in PLC_MAPPING.JOG_CONTROLS;
};

// Helper function to check if an event is a manual control
export const isManualControl = (eventName) => {
  return (
    eventName in PLC_MAPPING.MANUAL_CONTROLS ||
    eventName in PLC_MAPPING.ADDITIONAL_CONTROLS ||
    eventName in PLC_MAPPING.SYSTEM_CONTROLS
  );
};

// Default register and bit for unknown events
export const DEFAULT_MAPPING = {
  register: 1900,
  bit: 15, // Use last bit of first register for unknown events
  description: 'Unknown Operation',
};
