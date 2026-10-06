import React from 'react';
import { DashboardHeader } from './components/DashboardHeader';
import { VitalsGrid } from './components/VitalsGrid';
import { ECGMonitor } from './components/ECGMonitor';
import { SensorStatus } from './components/SensorStatus';
import { useTelemetry } from './hooks/useTelemetry';
import './App.css';

/**
 * App Component
 * SmartHealth IoT Health Monitoring Dashboard
 * 
 * Adheres strictly to DESIGN-GUIDE.md and Impeccable (https://impeccable.style/):
 * - Clean abstractions (useTelemetry handles hardware transports and streaming)
 * - Minimal, quiet palette (cool grey background, crisp white cards, restrained teal status, red ECG trace)
 * - Zero AI slop, zero emojis, zero gratuitous shadows/gradients
 * - Tabular numbers for medical readings
 * - Responsive by composition across mobile, tablet, and desktop
 */
export function App() {
  const {
    connectionStatus,
    lastUpdated,
    vitals,
    sensorStatus
  } = useTelemetry();

  return (
    <div className="app-viewport">
      <div className="dashboard-container">
        {/* 1. Persistent Top Header */}
        <DashboardHeader
          connectionStatus={connectionStatus}
          lastUpdated={lastUpdated}
        />

        {/* 2. Overview Heading */}
        <div className="overview-heading-block">
          <h1 className="overview-title">Patient overview</h1>
          <p className="overview-subtitle">Live readings from connected sensors.</p>
        </div>

        {/* 3. Vitals Readings Grid (Heart Rate, SpO2, Body Temperature) */}
        <VitalsGrid vitals={vitals} />

        {/* 4. Telemetry Monitor Grid (ECG Waveform + Hardware Sensor Status) */}
        <div className="monitor-grid">
          <ECGMonitor
            heartRate={vitals.heartRate}
            leadsConnected={sensorStatus?.ecgModule?.leadsConnected ?? true}
            signalQuality={sensorStatus?.ecgModule?.signalQuality || 'Good'}
          />

          <SensorStatus sensors={sensorStatus} />
        </div>
      </div>
    </div>
  );
}

export default App;
