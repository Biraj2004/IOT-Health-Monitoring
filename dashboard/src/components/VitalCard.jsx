import React from 'react';

/**
 * VitalCard Component
 * Displays a single primary vital measurement.
 * Adheres strictly to DESIGN-GUIDE.md:
 * - Current value is prominent (48-52px, tabular numerals)
 * - Label and unit are secondary
 * - Status is tertiary (green dot + textual state)
 * - Zero decorative icons or colorful fills
 */
export function VitalCard({
  label,
  value,
  unit,
  unitHint,
  statusText = 'Within expected range',
  statusType = 'normal' // 'normal' | 'warning' | 'alert' | 'disconnected'
}) {
  return (
    <article className="vital-card" aria-label={`${label} reading`}>
      <div className="vital-card-header">
        <h2 className="vital-label">{label}</h2>
        <span className="vital-unit-hint">{unitHint || unit}</span>
      </div>

      <div className="vital-value-group">
        <span className="vital-number">{value !== null && value !== undefined ? value : '—'}</span>
        <span className="vital-unit">{unit}</span>
      </div>

      <div className="vital-card-footer">
        <span className={`vital-status-dot status-${statusType}`} aria-hidden="true" />
        <span className="vital-status-text">{statusText}</span>
      </div>
    </article>
  );
}

export default VitalCard;
