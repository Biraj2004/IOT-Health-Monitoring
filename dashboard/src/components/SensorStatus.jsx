import React from 'react';

/**
 * SensorStatus Component
 * Displays the hardware module connectivity list.
 * Adheres strictly to DESIGN-GUIDE.md:
 * - Module names and text connection state
 * - Clear indicator dot
 * - Data source attribution
 */
export function SensorStatus({ sensors, deviceId = 'ESP32_001' }) {
  const pulseOximeter = sensors?.pulseOximeter || { name: 'Pulse oximeter', connected: true, statusText: 'Connected' };
  const temperatureProbe = sensors?.temperatureProbe || { name: 'Temperature probe', connected: true, statusText: 'Connected' };
  const ecgModule = sensors?.ecgModule || { name: 'ECG module', connected: true, statusText: 'Connected' };

  const sensorList = [
    { id: 'pulse-ox', ...pulseOximeter },
    { id: 'temp-probe', ...temperatureProbe },
    { id: 'ecg-mod', ...ecgModule }
  ];

  return (
    <article className="sensor-status-card" aria-label="Hardware Sensor Status">
      <h2 className="sensor-card-title">Sensor status</h2>

      <div className="sensor-list">
        {sensorList.map((sensor) => {
          const isConnected = sensor.connected;
          const statusClass = isConnected ? 'status-connected' : 'status-disconnected';

          return (
            <div key={sensor.id} className="sensor-item">
              <span className="sensor-name">{sensor.name}</span>
              <div className={`sensor-state ${statusClass}`}>
                <span className="sensor-dot" aria-hidden="true" />
                <span className="sensor-state-text">{sensor.statusText || (isConnected ? 'Connected' : 'Disconnected')}</span>
              </div>
            </div>
          );
        })}
      </div>

      <div className="sensor-card-footer">
        <span className="sensor-source-label">Hardware sensors ({deviceId || 'ESP32_001'})</span>
      </div>
    </article>
  );
}

export default SensorStatus;
