import React, { useState, useMemo } from 'react';

/**
 * EventLog Component
 * Formal telemetry event log stream:
 * - Alerts and notifications (threshold breaches, connection states)
 * - Severity classification (ALERT, WARN, INFO)
 * - Concise tabular typography
 * - Clean neutral styling for INFO items
 */
export function EventLog({ events = [], onClear }) {
  const [activeFilter, setActiveFilter] = useState('all');

  const filteredEvents = useMemo(() => {
    if (activeFilter === 'warning') {
      return events.filter(
        (e) => e.severity === 'warning' || e.severity === 'critical' || e.severity === 'alert'
      );
    }
    if (activeFilter === 'info') {
      return events.filter(
        (e) => e.severity === 'info' || e.severity === 'nominal' || !e.severity
      );
    }
    return events;
  }, [events, activeFilter]);

  const warningCount = useMemo(() => {
    return events.filter(
      (e) => e.severity === 'warning' || e.severity === 'critical' || e.severity === 'alert'
    ).length;
  }, [events]);

  const infoCount = useMemo(() => {
    return events.filter(
      (e) => e.severity === 'info' || e.severity === 'nominal' || !e.severity
    ).length;
  }, [events]);

  const getSeverityBadge = (severity) => {
    const s = (severity || 'info').toLowerCase();
    if (s === 'critical' || s === 'alert') {
      return {
        className: 'event-badge-critical',
        label: 'ALERT'
      };
    }
    if (s === 'warning') {
      return {
        className: 'event-badge-warning',
        label: 'WARN'
      };
    }
    return {
      className: 'event-badge-info',
      label: 'INFO'
    };
  };

  return (
    <article className="event-log-card" aria-label="Event Log">
      {/* 1. Header */}
      <div className="event-card-header">
        <div className="event-title-group">
          <div className="event-title-row">
            <h2 className="event-card-title">Event log</h2>
          </div>
          <span className="event-count-meta">{events.length} events</span>
        </div>

        <div className="event-header-actions">
          {onClear && events.length > 0 && (
            <button
              type="button"
              className="action-btn action-btn-quiet event-clear-btn"
              onClick={onClear}
              title="Clear event history"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* 2. Filter Toolbar */}
      <div className="event-toolbar">
        <div className="event-filter-tabs" role="tablist" aria-label="Event filter">
          <button
            type="button"
            role="tab"
            aria-selected={activeFilter === 'all'}
            className={`event-filter-tab ${activeFilter === 'all' ? 'tab-active' : ''}`}
            onClick={() => setActiveFilter('all')}
          >
            <span>All</span>
            <span className="filter-count-badge">{events.length}</span>
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={activeFilter === 'warning'}
            className={`event-filter-tab ${activeFilter === 'warning' ? 'tab-active' : ''}`}
            onClick={() => setActiveFilter('warning')}
          >
            <span>Alerts</span>
            {warningCount > 0 && (
              <span className="filter-count-badge badge-warning">{warningCount}</span>
            )}
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={activeFilter === 'info'}
            className={`event-filter-tab ${activeFilter === 'info' ? 'tab-active' : ''}`}
            onClick={() => setActiveFilter('info')}
          >
            <span>Info</span>
            <span className="filter-count-badge filter-count-neutral">{infoCount}</span>
          </button>
        </div>
      </div>

      {/* 3. Event List */}
      <div className="event-stream-container">
        {filteredEvents.length === 0 ? (
          <div className="event-empty-state">
            <span className="empty-text">No events recorded.</span>
          </div>
        ) : (
          <div className="event-list" role="feed" aria-busy="false">
            {filteredEvents.map((evt) => {
              const badge = getSeverityBadge(evt.severity);
              return (
                <div key={evt.id} className="event-row">
                  <div className="event-meta-col">
                    <span className="event-timestamp">{evt.timestamp}</span>
                    <span className={`event-severity-badge ${badge.className}`}>
                      {badge.label}
                    </span>
                  </div>

                  <div className="event-content-col">
                    <div className="event-category-row">
                      <span className="event-category-tag">{evt.category || 'Telemetry'}</span>
                      <span className="event-device-tag">{evt.deviceId || 'ESP32_001'}</span>
                    </div>
                    <p className="event-message-text">{evt.message}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 4. Footer */}
      <div className="event-card-footer">
        <div className="event-stream-status">
          <span className="stream-live-dot" aria-hidden="true" />
          <span className="stream-status-text">Live stream</span>
        </div>
        <span className="event-db-meta">Source: MongoDB alerts</span>
      </div>
    </article>
  );
}

export default EventLog;
