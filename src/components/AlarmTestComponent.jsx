import React from 'react';
import { useAlarmManager } from '@/hooks/useAlarmManager';
import { Button } from '@/components/ui/button';

/**
 * Test component to demonstrate the alarm management system
 * This component can be used to test that only one alarm popup appears at a time
 */
const AlarmTestComponent = () => {
  const { showAlarm, clearAllAlarms, getAlarmStatus } = useAlarmManager();

  const testAlarms = [
    {
      type: 'safety-violation',
      message: 'Safety violation: Door open during operation',
      priority: 'high'
    },
    {
      type: 'emergency-stop',
      message: 'Emergency stop activated',
      priority: 'high'
    },
    {
      type: 'part-presence',
      message: 'Part not detected in fixture',
      priority: 'normal'
    },
    {
      type: 'light-curtain',
      message: 'Light curtain interrupted',
      priority: 'normal'
    }
  ];

  const handleTestAlarm = (alarm) => {
    showAlarm(alarm.type, alarm.message, alarm.priority);
  };

  const handleRapidFireTest = () => {
    // Test rapid fire alarms to ensure only one shows at a time
    testAlarms.forEach((alarm, index) => {
      setTimeout(() => {
        showAlarm(alarm.type, `${alarm.message} (${index + 1})`, alarm.priority);
      }, index * 500); // Fire alarms every 500ms
    });
  };

  const status = getAlarmStatus();

  return (
    <div className="p-4 border rounded-lg bg-gray-50">
      <h3 className="text-lg font-semibold mb-4">Alarm System Test</h3>
      
      <div className="mb-4 p-3 bg-blue-50 rounded">
        <h4 className="font-medium mb-2">Current Status:</h4>
        <p>Active Alarm: {status.hasActiveAlarm ? 'Yes' : 'No'}</p>
        <p>Queue Length: {status.queueLength}</p>
        <p>Processing: {status.isProcessing ? 'Yes' : 'No'}</p>
        {status.activeAlarm && (
          <p>Current: {status.activeAlarm.type} - {status.activeAlarm.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <h4 className="font-medium">Test Individual Alarms:</h4>
        {testAlarms.map((alarm, index) => (
          <Button
            key={index}
            onClick={() => handleTestAlarm(alarm)}
            variant={alarm.priority === 'high' ? 'destructive' : 'outline'}
            className="mr-2 mb-2"
          >
            Test {alarm.type}
          </Button>
        ))}
      </div>

      <div className="mt-4 space-y-2">
        <h4 className="font-medium">Test Scenarios:</h4>
        <Button
          onClick={handleRapidFireTest}
          variant="secondary"
          className="mr-2"
        >
          Rapid Fire Test (Multiple Alarms)
        </Button>
        <Button
          onClick={clearAllAlarms}
          variant="outline"
        >
          Clear All Alarms
        </Button>
      </div>

      <div className="mt-4 text-sm text-gray-600">
        <p><strong>Expected Behavior:</strong></p>
        <ul className="list-disc list-inside space-y-1">
          <li>Only one alarm popup should be visible at a time</li>
          <li>High priority alarms (safety violations, emergency stops) should interrupt normal priority alarms</li>
          <li>Alarms should queue up and show in sequence</li>
          <li>Duplicate alarms of the same type should be prevented</li>
        </ul>
      </div>
    </div>
  );
};

export default AlarmTestComponent;
