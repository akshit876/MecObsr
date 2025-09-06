import React from 'react';
import { useAlarmManager } from '@/hooks/useAlarmManager';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

/**
 * Test component to demonstrate the alarm management system in manual mode
 * This component can be used to test that only one alarm popup appears at a time
 */
const ManualModeAlarmTest = () => {
  const { showAlarm, clearAllAlarms, getAlarmStatus } = useAlarmManager();

  const testAlarms = [
    {
      type: 'safety-violation',
      message: 'Safety violation: Door open during operation',
      priority: 'high',
    },
    {
      type: 'emergency-stop',
      message: 'Emergency stop activated by operator',
      priority: 'high',
    },
    {
      type: 'machine-error',
      message: 'Servo motor communication error',
      priority: 'normal',
    },
    {
      type: 'part-presence',
      message: 'Part not detected in fixture',
      priority: 'normal',
    },
    {
      type: 'light-curtain',
      message: 'Light curtain interrupted during operation',
      priority: 'normal',
    },
    {
      type: 'operation-success',
      message: 'Marking operation completed successfully',
      priority: 'normal',
    },
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

  const handleSimulateManualOperations = () => {
    // Simulate typical manual mode operations with alarms
    const operations = [
      { delay: 0, type: 'operation-success', message: 'Starting: Servo Home Position' },
      { delay: 1000, type: 'operation-success', message: 'Completed: Servo Home Position' },
      { delay: 1500, type: 'operation-success', message: 'Starting: Scanner Trigger' },
      { delay: 2000, type: 'operation-success', message: 'Completed: Scanner Trigger' },
      { delay: 2500, type: 'operation-success', message: 'Starting: Marking Start' },
      { delay: 3000, type: 'operation-success', message: 'Completed: Marking Start' },
    ];

    operations.forEach((op) => {
      setTimeout(() => {
        showAlarm(op.type, op.message, 'normal');
      }, op.delay);
    });
  };

  const status = getAlarmStatus();

  return (
    <Card className="w-full max-w-4xl bg-gray-800 text-white border-gray-600">
      <CardHeader>
        <CardTitle className="text-xl font-bold text-center text-yellow-300">
          Manual Mode Alarm Test
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="p-3 bg-gray-700 rounded-lg">
          <h4 className="font-medium mb-2 text-green-300">Current Status:</h4>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>Active Alarm: {status.hasActiveAlarm ? 'Yes' : 'No'}</div>
            <div>Queue Length: {status.queueLength}</div>
            <div>Processing: {status.isProcessing ? 'Yes' : 'No'}</div>
            <div>Current: {status.activeAlarm ? status.activeAlarm.type : 'None'}</div>
          </div>
        </div>

        <div className="space-y-2">
          <h4 className="font-medium text-blue-300">Test Individual Alarms:</h4>
          <div className="grid grid-cols-2 gap-2">
            {testAlarms.map((alarm, index) => (
              <Button
                key={index}
                onClick={() => handleTestAlarm(alarm)}
                variant={alarm.priority === 'high' ? 'destructive' : 'outline'}
                className="text-xs h-10"
              >
                Test {alarm.type}
              </Button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <h4 className="font-medium text-purple-300">Test Scenarios:</h4>
          <div className="grid grid-cols-1 gap-2">
            <Button
              onClick={handleRapidFireTest}
              variant="secondary"
              className="bg-orange-600 hover:bg-orange-700"
            >
              Rapid Fire Test (Multiple Alarms)
            </Button>
            <Button
              onClick={handleSimulateManualOperations}
              variant="secondary"
              className="bg-blue-600 hover:bg-blue-700"
            >
              Simulate Manual Operations
            </Button>
            <Button
              onClick={clearAllAlarms}
              variant="outline"
              className="border-red-500 text-red-300 hover:bg-red-900"
            >
              Clear All Alarms
            </Button>
          </div>
        </div>

        <div className="text-xs text-gray-400 space-y-1">
          <p>
            <strong>Expected Behavior:</strong>
          </p>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li>Only one alarm popup should be visible at a time</li>
            <li>
              High priority alarms (safety violations, emergency stops) should interrupt normal
              priority alarms
            </li>
            <li>Alarms should queue up and show in sequence</li>
            <li>Duplicate alarms of the same type should be prevented</li>
            <li>Manual operations should show start/completion notifications</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};

export default ManualModeAlarmTest;
