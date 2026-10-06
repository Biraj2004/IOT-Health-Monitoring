import React from 'react';
import { VitalCard } from './VitalCard';

/**
 * VitalsGrid Component
 * Renders the 3 core physiological metrics in responsive 3-column layout:
 * - Heart rate (bpm)
 * - Oxygen Saturation SpO₂ (%)
 * - Body temperature (°C)
 */
export function VitalsGrid({ vitals }) {
  const { heartRate, spo2, temperature } = vitals;

  // Heart rate status evaluation
  const hrStatusType = heartRate > 105 || heartRate < 50 ? 'warning' : 'normal';
  const hrStatusText = heartRate > 105 
    ? 'Elevated rate' 
    : heartRate < 50 
    ? 'Low rate' 
    : 'Within expected range';

  // SpO2 status evaluation
  const spo2StatusType = spo2 < 92 ? 'alert' : spo2 < 95 ? 'warning' : 'normal';
  const spo2StatusText = spo2 < 90 
    ? 'Low saturation' 
    : spo2 < 95 
    ? 'Borderline saturation' 
    : 'Within expected range';

  // Temperature status evaluation
  const tempStatusType = temperature > 37.8 || temperature < 35.5 ? 'warning' : 'normal';
  const tempStatusText = temperature > 37.8 
    ? 'Elevated temperature' 
    : temperature < 35.5 
    ? 'Low temperature' 
    : 'Within expected range';

  return (
    <section className="vitals-grid" aria-label="Current Vital Signs">
      <VitalCard
        label="Heart rate"
        value={heartRate}
        unit="bpm"
        unitHint="bpm"
        statusText={hrStatusText}
        statusType={hrStatusType}
      />

      <VitalCard
        label="SpO₂"
        value={spo2}
        unit="%"
        unitHint="%"
        statusText={spo2StatusText}
        statusType={spo2StatusType}
      />

      <VitalCard
        label="Body temperature"
        value={temperature}
        unit="°C"
        unitHint="°C"
        statusText={tempStatusText}
        statusType={tempStatusType}
      />
    </section>
  );
}

export default VitalsGrid;
