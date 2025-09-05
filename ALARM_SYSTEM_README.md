# Safety Alarm Management System

## Overview

This system ensures that only one safety alarm popup appears at a time on the UI, preventing alarm spam and improving user experience during critical safety situations.

## Key Features

### 1. Centralized Alarm Management
- **Single Source of Truth**: All alarms are managed through the `useAlarmManager` hook
- **Queue System**: Alarms are queued and displayed one at a time
- **Priority Handling**: High-priority alarms (safety violations, emergency stops) can interrupt normal alarms

### 2. Alarm Types and Priorities

#### High Priority Alarms
- **Safety Violations**: Critical safety issues that require immediate attention
- **Emergency Stops**: Emergency stop button activations
- These alarms can interrupt currently displayed alarms

#### Normal Priority Alarms
- **Part Presence**: Part detection issues
- **Light Curtain**: Light curtain interruptions
- These alarms are queued and shown in sequence

### 3. Duplicate Prevention
- Alarms of the same type cannot be displayed simultaneously
- Prevents spam from repeated events

## Implementation

### Core Hook: `useAlarmManager`

```javascript
const { showAlarm, clearAllAlarms, getAlarmStatus } = useAlarmManager();
```

#### Methods:
- `showAlarm(type, message, priority)`: Display an alarm
- `clearAllAlarms()`: Clear all active and queued alarms
- `getAlarmStatus()`: Get current alarm system status

### Usage Examples

#### Basic Alarm Display
```javascript
// Show a safety violation alarm
showAlarm('safety-violation', 'Door open during operation', 'high');

// Show a part presence warning
showAlarm('part-presence', 'Part not detected in fixture', 'normal');
```

#### In Event Handlers
```javascript
// Safety violation handler
const handleSafetyViolation = (data) => {
  showAlarm('safety-violation', `Alarm: ${data.violation}`, 'high');
};

// Emergency stop handler
const handleEmergencyStop = (data) => {
  showAlarm('emergency-stop', data.message || "Emergency button pressed", 'high');
};
```

## Configuration

### Alarm Types
- `safety-violation`: Critical safety issues (red background)
- `emergency-stop`: Emergency stop events (red background)
- `part-presence`: Part detection issues (orange background)
- `light-curtain`: Light curtain interruptions (orange background)

### Styling
Each alarm type has predefined styling:
- **Safety Violations & Emergency Stops**: Red background, large text, 8-10 second display
- **Part Presence & Light Curtain**: Orange background, medium text, 5 second display
- All alarms are centered at the top of the screen with high z-index

## Testing

A test component (`AlarmTestComponent`) is available to verify the alarm system:

1. **Individual Alarm Testing**: Test each alarm type separately
2. **Rapid Fire Testing**: Test multiple alarms in quick succession
3. **Status Monitoring**: View current alarm system status
4. **Clear All**: Clear all active and queued alarms

## Integration Points

### Updated Files:
1. **`src/hooks/useAlarmManager.js`**: Core alarm management logic
2. **`src/app/page.js`**: Updated safety violation handler
3. **`src/hooks/useMachineEvents.js`**: Updated machine event handlers
4. **`src/components/AlarmTestComponent.jsx`**: Test component (remove in production)

### Socket Events Handled:
- `safety_violation`: Safety violation events
- `emergency-stop`: Emergency stop events
- `part-presence`: Part detection events
- `light-curtation`: Light curtain events

## Benefits

1. **Improved UX**: No more alarm spam - only one popup at a time
2. **Priority Handling**: Critical alarms can interrupt less important ones
3. **Queue Management**: Alarms are processed in order
4. **Duplicate Prevention**: Same alarm type won't stack up
5. **Centralized Control**: Easy to manage and modify alarm behavior

## Production Notes

- Remove the `AlarmTestComponent` from the main page before production
- The test component is only for development and testing purposes
- All alarm configurations can be modified in the `useAlarmManager` hook

## Future Enhancements

- Sound alerts for different alarm types
- Alarm history logging
- User acknowledgment requirements for critical alarms
- Custom alarm durations per type
- Alarm escalation for unacknowledged critical alarms
