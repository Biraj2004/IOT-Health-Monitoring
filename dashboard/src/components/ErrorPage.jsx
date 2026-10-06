import React from 'react';
import { HomeIcon, FileTextIcon, ExternalLinkIcon } from './Icons';

/**
 * ErrorPage Component
 * Clean, minimalist, single-screen error view inspired by modern open layout:
 * - Huge, confident error code (404, 500, 503)
 * - Clear, concise heading and inline path chip
 * - High-contrast action buttons: Go to Home Dashboard + View Workflow Report
 * - Zero emojis, crisp SVG icons, zero horizontal scrolling
 * - Fits strictly within a single screen (no scrollbars)
 */
export function ErrorPage({
  initialErrorCode = '404',
  currentPath = window.location.pathname,
  onNavigateHome
}) {
  const is500 = initialErrorCode === '500';
  const is503 = initialErrorCode === '503';

  const errorCode = is500 ? '500' : is503 ? '503' : '404';
  const errorTitle = is500
    ? 'Telemetry Stream Fault'
    : is503
    ? 'Hardware Gateway Offline'
    : 'Lost in the Stream?';

  const pathDisplay = currentPath && currentPath !== '/' ? currentPath : '/404';

  const handleNavigateHome = () => {
    if (onNavigateHome) {
      onNavigateHome();
    } else {
      window.history.pushState(null, '', '/');
      window.dispatchEvent(new PopStateEvent('popstate'));
    }
  };

  return (
    <div className="error-viewport" role="main">
      {/* 1. Persistent Top Header */}
      <header className="dashboard-header error-header" role="banner">
        <div
          className="header-brand"
          onClick={handleNavigateHome}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === 'Enter' && handleNavigateHome()}
          style={{ cursor: 'pointer' }}
          aria-label="Return to dashboard"
        >
          <span className="brand-vital">VITAL</span>
          <span className="brand-slash">/</span>
          <span className="brand-monitor">MONITOR</span>
        </div>

        <a
          href="/workflow-report.pdf"
          target="_blank"
          rel="noopener noreferrer"
          className="action-btn action-btn-quiet"
          title="Open SmartHealth IoT Workflow Report (PDF)"
        >
          <FileTextIcon size={14} />
          <span>Workflow report</span>
          <ExternalLinkIcon size={12} className="btn-external-icon" />
        </a>
      </header>

      {/* 2. Main Open Minimalist Center Layout */}
      <main className="error-hero-container">
        <div className="error-hero-content">
          <div className="error-giant-number" aria-hidden="true">
            {errorCode}
          </div>

          <h1 className="error-hero-title">{errorTitle}</h1>

          <p className="error-hero-subtitle">
            {is500 ? (
              <>Live sensor data pipeline encountered an unexpected interruption.</>
            ) : is503 ? (
              <>Unable to establish connection with the IoT edge gateway.</>
            ) : (
              <>
                The path <code className="inline-path-code">{pathDisplay}</code> does not exist or may have been moved.
              </>
            )}
          </p>

          <div className="error-hero-actions">
            <button
              type="button"
              className="action-btn action-btn-primary action-btn-lg"
              onClick={handleNavigateHome}
            >
              <HomeIcon size={16} />
              <span>Go to Home Dashboard</span>
            </button>

            <a
              href="/workflow-report.pdf"
              target="_blank"
              rel="noopener noreferrer"
              className="action-btn action-btn-secondary action-btn-lg"
            >
              <FileTextIcon size={16} />
              <span>View Workflow Report</span>
              <ExternalLinkIcon size={13} className="btn-external-icon" />
            </a>
          </div>
        </div>
      </main>
    </div>
  );
}

export default ErrorPage;
