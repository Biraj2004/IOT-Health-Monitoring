import React from 'react';

/**
 * DashboardHeader Component
 * Implements the persistent instrument header per DESIGN-GUIDE.md:
 * - Product label: VITAL / MONITOR
 * - Hardware connection state: DEVICE CONNECTED
 * - Last data update timestamp with clear stale indication
 */
export function DashboardHeader({ connectionStatus = 'connected', lastUpdated }) {
  const isConnected = connectionStatus === 'connected';
  const isReconnecting = connectionStatus === 'reconnecting';

  const connectionLabel = isConnected
    ? 'DEVICE CONNECTED'
    : isReconnecting
    ? 'RECONNECTING'
    : 'DEVICE DISCONNECTED';

  return (
    <header className="dashboard-header" role="banner">
      <div className="header-brand">
        <span className="brand-vital">VITAL</span>
        <span className="brand-slash">/</span>
        <span className="brand-monitor">MONITOR</span>
      </div>

      <div className="header-meta">
        <div className={`connection-badge connection-${connectionStatus}`}>
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
