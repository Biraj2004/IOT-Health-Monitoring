import React from 'react';
import { FileTextIcon, ExternalLinkIcon } from './Icons';

/**
 * DashboardHeader Component
 * Clinical instrument header per DESIGN-GUIDE.md:
 * - Brand: VITAL / MONITOR
 * - Right side: Workflow report button, hardware connection state, last update time
 * - Report button hidden on mobile (≤767px)
 * - Completely responsive with zero horizontal overflow
 */
export function DashboardHeader({
  connectionStatus = 'connected',
  dataSource = 'live',
  lastUpdated,
  deviceId,
  devices = [],
  selectedDeviceId = '',
  onSelectDevice,
}) {
  const isConnected = connectionStatus === 'connected';
  const isReconnecting = connectionStatus === 'reconnecting';
  const isDemo = !isConnected && dataSource === 'demo';

  const connectionLabel = isConnected
    ? 'DEVICE CONNECTED'
    : isDemo
    ? 'DEMO MODE'
    : isReconnecting
    ? 'RECONNECTING'
    : 'DEVICE DISCONNECTED';

  const badgeStatusClass = isDemo ? 'reconnecting' : connectionStatus;

  return (
    <header className="dashboard-header" role="banner">
      <div className="header-primary-group">
        <div className="header-brand">
          <span className="brand-vital">VITAL</span>
          <span className="brand-slash">/</span>
          <span className="brand-monitor">MONITOR</span>
        </div>

        {devices.length > 1 && onSelectDevice ? (
          <select
            className="header-device-select"
            aria-label="Select hardware device"
            value={selectedDeviceId}
            onChange={(e) => onSelectDevice(e.target.value)}
          >
            <option value="">Auto ({deviceId || 'Latest'})</option>
            {devices.map((dev) => (
              <option key={dev.device_id} value={dev.device_id}>
                {dev.device_id}
              </option>
            ))}
          </select>
        ) : deviceId ? (
          <span className="header-device-pill" title="Active hardware node">
            {deviceId}
          </span>
        ) : null}
      </div>

      <div className="header-meta">
        <a
          href="/workflow-report.pdf"
          target="_blank"
          rel="noopener noreferrer"
          className="action-btn action-btn-quiet header-report-btn"
          title="Open SmartHealth IoT Workflow Report (PDF)"
        >
          <FileTextIcon size={14} />
          <span>Workflow report</span>
          <ExternalLinkIcon size={12} className="btn-external-icon" />
        </a>

        <span className="header-divider header-report-divider" aria-hidden="true" />

        <div className={`connection-badge connection-${badgeStatusClass}`}>
          <span className="connection-dot" aria-hidden="true" />
          <span className="connection-label">{connectionLabel}</span>
        </div>

        <span className="header-divider" aria-hidden="true" />

        <div className="update-status">
          <span className="update-label">Last update</span>
          <span className="update-timestamp">{lastUpdated || '--:--:--'}</span>
        </div>
      </div>
    </header>
  );
}

export default DashboardHeader;
