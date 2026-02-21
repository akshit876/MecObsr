'use client';

import React from 'react';
import { useSafetyAlarms } from '@/hooks/useSafetyAlarms';

const REED_SWITCH_ALARMS = [
  'SLIDE FWD REED-SWITCH MISSING',
  'SLIDE HOME REED-SWITCH MISSING',
];

function getAlarmSeverity(violation) {
  if (REED_SWITCH_ALARMS.includes(violation)) {
    return 'reed_switch'; // orange style
  }
  return 'safety'; // red style
}

function formatTime(iso) {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
}

export function AlarmsPanel() {
  const alarms = useSafetyAlarms();

  return (
    <div className="alarms-panel rounded-xl bg-white shadow-sm border border-gray-200 overflow-hidden">
      <div className="px-3 py-2 bg-[#012B41] text-white">
        <h3 className="text-sm font-semibold">Safety Alarms</h3>
        <p className="text-xs text-gray-300">Backend: safety_violation (register 1490)</p>
      </div>
      <div className="max-h-[220px] overflow-y-auto p-2">
        {alarms.length === 0 ? (
          <p className="text-sm text-gray-500 py-4 text-center">No active alarms</p>
        ) : (
          <ul className="space-y-1.5">
            {alarms.map((a) => {
              const severity = getAlarmSeverity(a.message);
              const isReed = severity === 'reed_switch';
              return (
                <li
                  key={a.id}
                  className={`text-xs rounded-lg px-2.5 py-2 border-l-4 ${
                    isReed
                      ? 'bg-amber-50 border-amber-500 text-amber-900'
                      : 'bg-red-50 border-red-600 text-red-900'
                  }`}
                >
                  <strong className="block font-semibold">{a.message}</strong>
                  <span className="text-[11px] opacity-90">
                    {formatTime(a.time)}
                    {a.cycle != null && ` · cycle ${a.cycle}`}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}

export default AlarmsPanel;
