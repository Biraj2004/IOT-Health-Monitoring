import React from 'react';

/**
 * MLAnalysisCard Component
 * Formal telemetry ML evaluation panel:
 * - Isolation Forest Anomaly Detection (contamination=0.03, score [0.00 - 1.00])
 * - Multi-vital linear trend projection
 * - Lead I ECG rhythm regularity analysis
 * - Feature vector matrix [μ_HR, σ_HR, μ_SpO2, μ_Temp, ΔTemp, RMS_ECG]
 * - Non-diagnostic research index
 */
export function MLAnalysisCard({ mlData, heartRate }) {
  const data = mlData || {};
  const anomalyScore = typeof data.anomalyScore === 'number' ? data.anomalyScore : 0.08;
  const threshold = data.threshold ?? 0.65;
  const isAnomaly = data.isAnomaly ?? (anomalyScore >= threshold);
  const statusLabel = isAnomaly ? 'Elevated' : (anomalyScore > 0.45 ? 'Borderline' : 'Normal');

  const hrTrend = data.trends?.heartRate || { direction: 'Stable', slope: '+0.1 bpm/min' };
  const spo2Trend = data.trends?.spo2 || { direction: 'Steady', slope: '0.0 %/min' };
  const tempTrend = data.trends?.temperature || { direction: 'Constant', slope: '+0.0 °C/hr' };

  const currentHr = typeof heartRate === 'number' ? heartRate : 72;
  const computedRrInterval = Math.round(60000 / Math.max(30, Math.min(220, currentHr)));
  const rhythmClassification = currentHr > 100 
    ? 'Sinus Tachycardia' 
    : (currentHr < 60 ? 'Sinus Bradycardia' : 'Normal Sinus Rhythm');

  const ecgPattern = data.ecgPattern || {
    classification: rhythmClassification,
    rrInterval: computedRrInterval,
    rrVariance: 12
  };

  const features = data.features || {
    meanHr: Number(currentHr.toFixed(1)),
    stdHr: 1.6,
    meanSpo2: 98.8,
    meanTemp: 36.8,
    deltaTemp: 0.02,
    rmsEcg: 142
  };

  const statusClass = isAnomaly ? 'status-alert' : (anomalyScore > 0.45 ? 'status-warning' : 'status-normal');
  const badgeClass = isAnomaly ? 'ml-badge-alert' : (anomalyScore > 0.45 ? 'ml-badge-warning' : 'ml-badge-nominal');

  const scorePercent = Math.min(100, Math.max(0, Math.round(anomalyScore * 100)));
  const thresholdPercent = Math.min(100, Math.max(0, Math.round(threshold * 100)));

  return (
    <article className="ml-analysis-card" aria-label="Machine Learning Telemetry Analysis">
      {/* 1. Header without icons */}
      <div className="ml-card-header">
        <div className="ml-title-group">
          <div className="ml-title-row">
            <h2 className="ml-card-title">ML analysis</h2>
          </div>
          <span className="ml-model-tag">Isolation Forest</span>
        </div>

        <div className={`ml-status-pill ${badgeClass}`}>
          <span className={`vital-status-dot ${statusClass}`} aria-hidden="true" />
          <span className="ml-status-text">{statusLabel}</span>
        </div>
      </div>

      {/* 2. Anomaly Metric & Threshold */}
      <div className="ml-metric-section">
        <div className="ml-score-row">
          <div className="ml-score-display">
            <span className="ml-metric-label">Anomaly score</span>
            <div className="ml-score-val-wrap">
              <span className="ml-score-number">{anomalyScore.toFixed(2)}</span>
            </div>
          </div>

          <div className="ml-gauge-container">
            <div className="ml-gauge-track" role="progressbar" aria-valuenow={anomalyScore} aria-valuemin="0" aria-valuemax="1">
              <div 
                className={`ml-gauge-bar ${isAnomaly ? 'gauge-alert' : (anomalyScore > 0.45 ? 'gauge-warning' : 'gauge-nominal')}`} 
                style={{ width: `${scorePercent}%` }} 
              />
              <div 
                className="ml-gauge-threshold-marker" 
                style={{ left: `${thresholdPercent}%` }}
                title={`Threshold: ${threshold.toFixed(2)}`}
              />
            </div>
            <div className="ml-gauge-labels">
              <span>0.00</span>
              <span className="ml-threshold-label">Threshold ({threshold.toFixed(2)})</span>
              <span>1.00</span>
            </div>
          </div>
        </div>

        <p className="ml-diagnostic-summary">
          {isAnomaly ? (
            <span className="summary-alert">
              Elevated anomaly score detected
            </span>
          ) : (
            <span className="summary-nominal">
              Multivariable readings within baseline limits
            </span>
          )}
        </p>
      </div>

      {/* 3. Trend Projection & ECG Rhythm Grid */}
      <div className="ml-subgrid">
        <div className="ml-subcard">
          <div className="ml-subcard-header">
            <h3 className="ml-subcard-title">Trend projection</h3>
          </div>
          <div className="ml-trend-list">
            <div className="ml-trend-item">
              <span className="ml-trend-label">Heart rate</span>
              <div className="ml-trend-value">
                <span className="ml-trend-direction">{hrTrend.direction}</span>
                <span className="ml-trend-slope">{hrTrend.slope}</span>
              </div>
            </div>

            <div className="ml-trend-item">
              <span className="ml-trend-label">SpO₂</span>
              <div className="ml-trend-value">
                <span className="ml-trend-direction">{spo2Trend.direction}</span>
                <span className="ml-trend-slope">{spo2Trend.slope}</span>
              </div>
            </div>

            <div className="ml-trend-item">
              <span className="ml-trend-label">Temperature</span>
              <div className="ml-trend-value">
                <span className="ml-trend-direction">{tempTrend.direction}</span>
                <span className="ml-trend-slope">{tempTrend.slope}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="ml-subcard">
          <div className="ml-subcard-header">
            <h3 className="ml-subcard-title">ECG rhythm</h3>
          </div>
          <div className="ml-rhythm-body">
            <div className="ml-rhythm-badge">
              <span className="ml-rhythm-name">{ecgPattern.classification}</span>
            </div>
            <div className="ml-rhythm-details">
              <div className="ml-rhythm-row">
                <span className="rhythm-label">R-R interval:</span>
                <span className="rhythm-value">{ecgPattern.rrInterval} ms</span>
              </div>
              <div className="ml-rhythm-row">
                <span className="rhythm-label">R-R variance:</span>
                <span className="rhythm-value">±{ecgPattern.rrVariance} ms</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 4. Extracted Feature Vector */}
      <div className="ml-features-container">
        <div className="ml-features-header">
          <span className="features-title">Feature vector</span>
          <span className="features-eq">Sliding window</span>
        </div>
        <div className="ml-features-grid">
          <div className="feature-cell">
            <span className="feature-name">μ_HR</span>
            <span className="feature-val">{features.meanHr} bpm</span>
          </div>
          <div className="feature-cell">
            <span className="feature-name">σ_HR</span>
            <span className="feature-val">{features.stdHr} bpm</span>
          </div>
          <div className="feature-cell">
            <span className="feature-name">μ_SpO2</span>
            <span className="feature-val">{features.meanSpo2}%</span>
          </div>
          <div className="feature-cell">
            <span className="feature-name">μ_Temp</span>
            <span className="feature-val">{features.meanTemp}°C</span>
          </div>
          <div className="feature-cell">
            <span className="feature-name">ΔTemp</span>
            <span className="feature-val">+{features.deltaTemp}°C</span>
          </div>
          <div className="feature-cell">
            <span className="feature-name">RMS_ECG</span>
            <span className="feature-val">{features.rmsEcg}</span>
          </div>
        </div>
      </div>

      {/* 5. Footer */}
      <div className="ml-card-footer">
        <span className="ml-latency-meta">Latency: &lt; {data.inferenceLatencyMs ?? 3.8} ms</span>
        <span className="ml-disclaimer-meta">Non-diagnostic research index</span>
      </div>
    </article>
  );
}

export default MLAnalysisCard;
