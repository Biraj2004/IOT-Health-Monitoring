import React, { useRef, useEffect } from 'react';

/**
 * ECGMonitor Component
 * Implements the live single-lead ECG monitor per DESIGN-GUIDE.md:
 * - Authentic Lead I waveform generated from heartRate
 * - Precision medical millimeter grid (minor #F0E6E6, major #E6D4D4)
 * - Calibrated Y-axis (mV) and X-axis (seconds)
 * - Restrained red trace (#E52B2B)
 * - Responsive canvas resizing with HiDPI / Retina support
 * - Footer with paper sweep speed and signal quality state
 */
export function ECGMonitor({
  heartRate = 72,
  leadsConnected = true,
  signalQuality = 'Good'
}) {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const animationFrameRef = useRef(null);

  // References for continuous 60fps sweep animation
  const sweepXRef = useRef(0);
  const phaseRef = useRef(0);
  const bufferRef = useRef([]);
  const heartRateRef = useRef(heartRate);

  useEffect(() => {
    heartRateRef.current = heartRate;
  }, [heartRate]);

  // Synthetic physiological Lead I P-Q-R-S-T generator
  const computeSample = React.useCallback((phase) => {
    if (!leadsConnected) {
      return (Math.random() - 0.5) * 0.03; // Flatline analog noise
    }

    let val = 0;

    // P-wave (Atrial depolarization: gentle dome ~0.15 mV)
    if (phase >= 0.10 && phase <= 0.20) {
      const p = (phase - 0.15) / 0.045;
      val += 0.15 * Math.exp(-p * p * 4);
    }

    // Q-dip (Septal depolarization: brief dip ~-0.12 mV)
    if (phase >= 0.28 && phase <= 0.315) {
      const q = (phase - 0.30) / 0.012;
      val -= 0.14 * Math.exp(-q * q * 10);
    }

    // R-peak (Ventricular depolarization: tall sharp spike ~0.70 mV)
    if (phase >= 0.315 && phase <= 0.37) {
      const r = (phase - 0.34) / 0.018;
      val += 0.72 * Math.exp(-r * r * 8);
    }

    // S-dip (Late ventricular depolarization: sharp dip ~-0.22 mV)
    if (phase >= 0.37 && phase <= 0.42) {
      const s = (phase - 0.395) / 0.016;
      val -= 0.24 * Math.exp(-s * s * 8);
    }

    // T-wave (Ventricular repolarization: rounded wave ~0.20 mV)
    if (phase >= 0.54 && phase <= 0.70) {
      const t = (phase - 0.62) / 0.07;
      val += 0.22 * Math.exp(-t * t * 3.5);
    }

    // Subtle natural analog noise
    val += (Math.random() - 0.5) * 0.012;

    return val;
  }, [leadsConnected]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext('2d');

    const handleResize = () => {
      const rect = container.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      const width = Math.max(0, Math.floor(rect.width));
      // Height comes from CSS (.ecg-canvas breakpoints); fallback to 220px
      const cssHeight = Math.floor(canvas.getBoundingClientRect().height);
      const height = cssHeight > 0 ? cssHeight : 220;

      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = '100%';

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      // Re-initialize sample ring buffer if width changed
      const plotWidth = Math.max(10, width - 60);
      if (bufferRef.current.length !== plotWidth) {
        bufferRef.current = new Array(plotWidth).fill(0);
        sweepXRef.current = 0;
      }
    };

    handleResize();
    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(container);

    let lastTime = performance.now();

    const render = (currentTime) => {
      const width = canvas.width / (window.devicePixelRatio || 1);
      const height = canvas.height / (window.devicePixelRatio || 1);

      if (width <= 0 || height <= 0) {
        animationFrameRef.current = requestAnimationFrame(render);
        return;
      }

      const dt = Math.min(0.05, (currentTime - lastTime) / 1000);
      lastTime = currentTime;

      // Layout geometry for axes and grid
      const gutterLeft = 40;
      const gutterRight = 12;
      const gutterTop = 14;
      const gutterBottom = 22;
      const gridWidth = Math.max(10, width - gutterLeft - gutterRight);
      const gridHeight = Math.max(10, height - gutterTop - gutterBottom);

      const baselineY = gutterTop + gridHeight / 2; // 0 mV line
      const mvScale = gridHeight / 2.2; // 1.0 mV maps to ~45% of half-height

      // Advance cardiac cycle phase based on actual heart rate
      const hr = heartRateRef.current || 72;
      const bps = hr / 60; // beats per second
      phaseRef.current = (phaseRef.current + dt * bps) % 1.0;

      // Advance sweep position (standard 8 second window)
      const sweepSpeedPx = gridWidth / 8.0; // 8 seconds per sweep width
      const step = Math.max(1, Math.round(dt * sweepSpeedPx));

      for (let i = 0; i < step; i++) {
        const sample = computeSample(phaseRef.current);
        const curX = Math.floor(sweepXRef.current);
        if (curX < gridWidth) {
          bufferRef.current[curX] = sample;
        }
        sweepXRef.current = (sweepXRef.current + 1) % gridWidth;
      }

      // 1. Clear background
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, width, height);

      // 2. Draw ECG Millimeter Grid inside grid area
      ctx.save();
      ctx.beginPath();
      ctx.rect(gutterLeft, gutterTop, gridWidth, gridHeight);
      ctx.clip();

      // Minor grid (every 5px / 1mm)
      ctx.lineWidth = 0.5;
      ctx.strokeStyle = '#F0E6E6';
      ctx.beginPath();
      for (let x = gutterLeft; x <= gutterLeft + gridWidth; x += 5) {
        ctx.moveTo(x, gutterTop);
        ctx.lineTo(x, gutterTop + gridHeight);
      }
      for (let y = gutterTop; y <= gutterTop + gridHeight; y += 5) {
        ctx.moveTo(gutterLeft, y);
        ctx.lineTo(gutterLeft + gridWidth, y);
      }
      ctx.stroke();

      // Major grid (every 25px / 5mm)
      ctx.lineWidth = 0.75;
      ctx.strokeStyle = '#E6D4D4';
      ctx.beginPath();
      for (let x = gutterLeft; x <= gutterLeft + gridWidth; x += 25) {
        ctx.moveTo(x, gutterTop);
        ctx.lineTo(x, gutterTop + gridHeight);
      }
      for (let y = gutterTop; y <= gutterTop + gridHeight; y += 25) {
        ctx.moveTo(gutterLeft, y);
        ctx.lineTo(gutterLeft + gridWidth, y);
      }
      ctx.stroke();

      // 3. Draw ECG waveform trace in medical red (#E52B2B)
      const curSweepX = Math.floor(sweepXRef.current);
      const eraseGap = 16; // pixels of erase barrier

      ctx.lineWidth = 1.75;
      ctx.strokeStyle = '#E52B2B';
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      // First segment: from (curSweepX + eraseGap) to gridWidth
      const seg1Start = curSweepX + eraseGap;
      if (seg1Start < gridWidth) {
        ctx.beginPath();
        let started = false;
        for (let x = seg1Start; x < gridWidth; x++) {
          const val = bufferRef.current[x] || 0;
          const pxY = baselineY - val * mvScale;
          const pxX = gutterLeft + x;
          if (!started) {
            ctx.moveTo(pxX, pxY);
            started = true;
          } else {
            ctx.lineTo(pxX, pxY);
          }
        }
        ctx.stroke();
      }

      // Second segment: from 0 to curSweepX
      if (curSweepX > 1) {
        ctx.beginPath();
        let started = false;
        for (let x = 0; x < curSweepX; x++) {
          const val = bufferRef.current[x] || 0;
          const pxY = baselineY - val * mvScale;
          const pxX = gutterLeft + x;
          if (!started) {
            ctx.moveTo(pxX, pxY);
            started = true;
          } else {
            ctx.lineTo(pxX, pxY);
          }
        }
        ctx.stroke();
      }

      // Moving circular red dot cursor tracking the leading sweep edge
      const activeIndex = Math.max(0, Math.min(gridWidth - 1, curSweepX > 0 ? curSweepX - 1 : 0));
      const activeVal = bufferRef.current[activeIndex] || 0;
      const dotPxX = gutterLeft + activeIndex;
      const dotPxY = baselineY - activeVal * mvScale;

      ctx.beginPath();
      ctx.arc(dotPxX, dotPxY, 3.5, 0, Math.PI * 2);
      ctx.fillStyle = '#E52B2B';
      ctx.fill();

      ctx.restore();

      // 4. Draw Grid Outer Border
      ctx.lineWidth = 1;
      ctx.strokeStyle = '#E6D4D4';
      ctx.strokeRect(gutterLeft, gutterTop, gridWidth, gridHeight);

      // 5. Draw Y-axis Scale Labels & Ticks
      ctx.font = '500 10px Inter, sans-serif';
      ctx.fillStyle = '#778294';
      ctx.textAlign = 'right';
      ctx.textBaseline = 'middle';

      const yTicks = [
        { label: '1.0', mv: 1.0 },
        { label: '0.5', mv: 0.5 },
        { label: '0', mv: 0 },
        { label: '-0.5', mv: -0.5 },
        { label: '-1.0', mv: -1.0 }
      ];

      yTicks.forEach(({ label, mv }) => {
        const yPos = baselineY - mv * mvScale;
        if (yPos >= gutterTop && yPos <= gutterTop + gridHeight) {
          ctx.fillText(label, gutterLeft - 6, yPos);
          // Tick line
          ctx.beginPath();
          ctx.moveTo(gutterLeft - 3, yPos);
          ctx.lineTo(gutterLeft, yPos);
          ctx.strokeStyle = '#D8DEE5';
          ctx.lineWidth = 1;
          ctx.stroke();
        }
      });

      // Axis unit 'mV' label
      ctx.textAlign = 'right';
      ctx.fillText('mV', gutterLeft - 16, baselineY);

      // 6. Draw X-axis Time Scale Labels (0s to 8s)
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';

      const xTicks = [
        { label: '0s', ratio: 0.0 },
        { label: '2s', ratio: 0.25 },
        { label: '4s', ratio: 0.5 },
        { label: '6s', ratio: 0.75 },
        { label: '8s', ratio: 1.0 }
      ];

      xTicks.forEach(({ label, ratio }) => {
        const xPos = gutterLeft + ratio * gridWidth;
        ctx.fillText(label, xPos, gutterTop + gridHeight + 6);

        // Tick line
        ctx.beginPath();
        ctx.moveTo(xPos, gutterTop + gridHeight);
        ctx.lineTo(xPos, gutterTop + gridHeight + 3);
        ctx.strokeStyle = '#D8DEE5';
        ctx.lineWidth = 1;
        ctx.stroke();
      });

      animationFrameRef.current = requestAnimationFrame(render);
    };

    animationFrameRef.current = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animationFrameRef.current);
      resizeObserver.disconnect();
    };
  }, [computeSample]);

  return (
    <article className="ecg-monitor-card" aria-label="ECG Lead I Real-Time Plot">
      <div className="ecg-card-header">
        <h2 className="ecg-card-title">ECG · Lead I</h2>
        <span className="live-pill" aria-label="Live stream active">
          LIVE
        </span>
      </div>

      <div className="ecg-canvas-wrapper" ref={containerRef}>
        <canvas ref={canvasRef} className="ecg-canvas" />
      </div>

      <div className="ecg-card-footer">
        <span className="ecg-calibration">25 mm/s · 10 mm/mV</span>
        <div className="ecg-signal-info">
          <span className="signal-label">Signal quality: </span>
          <strong className={`signal-state state-${signalQuality.toLowerCase()}`}>
            {signalQuality}
          </strong>
        </div>
      </div>
    </article>
  );
}

export default ECGMonitor;
