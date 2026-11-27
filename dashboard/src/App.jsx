import React, { useState, useEffect } from 'react';
import { DashboardHeader } from './components/DashboardHeader';
import { VitalsGrid } from './components/VitalsGrid';
import { ECGMonitor } from './components/ECGMonitor';
import { SensorStatus } from './components/SensorStatus';
import { MLAnalysisCard } from './components/MLAnalysisCard';
import { EventLog } from './components/EventLog';
import { ErrorPage } from './components/ErrorPage';
import { useTelemetry } from './hooks/useTelemetry';
import './App.css';

/**
 * App Component
 * SmartHealth IoT Health Monitoring Dashboard & Routing System
 * 
 * Adheres strictly to DESIGN-GUIDE.md and Impeccable (https://impeccable.style/):
 * - Pure minimalism: zero clutter, zero emojis, quiet neutrals, tabular typography
 * - Clean abstractions (useTelemetry handles hardware transports and streaming)
 * - Single-screen error pages (404, 500, 503) matching dashboard design language
 * - Direct mapping to workflow report PDF across dashboard header and error pages
 * - Complete AI/ML analysis and live system/clinical event logging
 */
export function App() {
  const [currentPath, setCurrentPath] = useState(() => window.location.pathname);

  // Synchronize route on browser back/forward and pushState
  useEffect(() => {
    const onLocationChange = () => {
      setCurrentPath(window.location.pathname);
    };

    window.addEventListener('popstate', onLocationChange);
    return () => window.removeEventListener('popstate', onLocationChange);
  }, []);

  const navigate = (path) => {
    window.history.pushState(null, '', path);
    setCurrentPath(path);
  };

  const {
    connectionStatus,
    dataSource,
    backendMeta,
    lastUpdated,
    vitals,
    sensorStatus,
    mlAnalysis,
    ecgSamples,
    ecgBatchId,
    deviceId,
    selectedDeviceId,
    onSelectDevice,
    devices,
    eventLogs,
    clearEvents
  } = useTelemetry();

  // Normalize path
  const normalizedPath = currentPath.toLowerCase().replace(/\/$/, '') || '/';

  // Route to clinical error pages
  if (normalizedPath === '/404') {
    return <ErrorPage initialErrorCode="404" onNavigateHome={() => navigate('/')} />;
  }
  if (normalizedPath === '/500') {
    return <ErrorPage initialErrorCode="500" onNavigateHome={() => navigate('/')} />;
  }
  if (normalizedPath === '/503') {
    return <ErrorPage initialErrorCode="503" onNavigateHome={() => navigate('/')} />;
  }

  // Any unrecognized route defaults to 404
  if (normalizedPath !== '/' && normalizedPath !== '/index.html') {
    return <ErrorPage initialErrorCode="404" onNavigateHome={() => navigate('/')} />;
  }

  const overviewSubtitle =
    connectionStatus === 'connected'
      ? 'Live readings from connected sensors.'
      : dataSource === 'demo'
      ? 'Simulated baseline telemetry (backend offline).'
      : dataSource === 'snapshot'
      ? 'Showing last recorded telemetry snapshot; reconnecting live stream.'
      : 'Waiting for telemetry from FastAPI backend.';

  // Primary Clinical Dashboard
  return (
    <div className="app-viewport">
      <div className="dashboard-container">
        {/* 1. Persistent Top Header with Workflow Report PDF Button */}
        <DashboardHeader
          connectionStatus={connectionStatus}
          dataSource={dataSource}
          lastUpdated={lastUpdated}
          deviceId={deviceId}
          devices={devices}
          selectedDeviceId={selectedDeviceId}
          onSelectDevice={onSelectDevice}
        />

        {/* 2. Overview Heading */}
        <div className="overview-heading-block">
          <h1 className="overview-title">Patient overview</h1>
          <p className="overview-subtitle">{overviewSubtitle}</p>
        </div>

        {/* 3. Vitals Readings Grid (Heart Rate, SpO2, Body Temperature) */}
        <VitalsGrid vitals={vitals} />

        {/* 4. Telemetry Monitor Grid (ECG Waveform + Hardware Sensor Status) */}
        <div className="monitor-grid">
          <ECGMonitor
            heartRate={vitals.heartRate}
            leadsConnected={sensorStatus?.ecgModule?.leadsConnected ?? false}
            signalQuality={sensorStatus?.ecgModule?.signalQuality || 'No signal'}
            ecgSamples={ecgSamples}
            ecgBatchId={ecgBatchId}
            connectionStatus={connectionStatus}
            dataSource={dataSource}
          />

          <SensorStatus sensors={sensorStatus} deviceId={deviceId} />
        </div>

        {/* 5. Clinical Analytics & Event Stream Grid (AI/ML Analysis + Event Log) */}
        <div className="analytics-grid">
          <MLAnalysisCard
            mlData={mlAnalysis}
            heartRate={vitals.heartRate}
          />

          <EventLog
            events={eventLogs}
            onClear={clearEvents}
            connectionStatus={connectionStatus}
            dataSource={dataSource}
            backendDatabase={backendMeta?.database}
          />
        </div>
      </div>
    </div>
  );
}

export default App;
