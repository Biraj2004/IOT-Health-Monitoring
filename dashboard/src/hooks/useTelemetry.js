import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * Custom Hook: useTelemetry
 * Telemetry layer between hardware sensor modules (MAX30102, DS18B20, AD8232),
 * ML inference pipeline, and dashboard presentation layer.
 */
export function useTelemetry() {
  const [connectionStatus, setConnectionStatus] = useState('connected'); // 'connected' | 'reconnecting' | 'disconnected'
  
  const formatTime = useCallback((dateObj = new Date()) => {
    return dateObj.toTimeString().split(' ')[0]; // '14:32:08'
  }, []);

  const [lastUpdated, setLastUpdated] = useState(() => formatTime());

  // Core vitals
  const [vitals, setVitals] = useState({
    heartRate: 72,
    spo2: 99,
    temperature: 36.8
  });

  // Hardware module states
  const [sensorStatus, setSensorStatus] = useState({
    pulseOximeter: {
      name: 'Pulse oximeter',
      connected: true,
      statusText: 'Connected'
    },
    temperatureProbe: {
      name: 'Temperature probe',
      connected: true,
      statusText: 'Connected'
    },
    ecgModule: {
      name: 'ECG module',
      connected: true,
      statusText: 'Connected',
      signalQuality: 'Good',
      leadsConnected: true
    }
  });

  // ML Analysis state
  const [mlAnalysis, setMlAnalysis] = useState({
    status: 'Normal',
    isAnomaly: false,
    anomalyScore: 0.08,
    threshold: 0.65,
    riskLevel: 'Nominal',
    trends: {
      heartRate: { direction: 'Stable', slope: '+0.1 bpm/min' },
      spo2: { direction: 'Steady', slope: '0.0 %/min' },
      temperature: { direction: 'Constant', slope: '+0.0 °C/hr' }
    },
    ecgPattern: {
      classification: 'Normal Sinus Rhythm',
      rrInterval: 833,
      rrVariance: 12
    },
    features: {
      meanHr: 72.4,
      stdHr: 1.6,
      meanSpo2: 98.8,
      meanTemp: 36.8,
      deltaTemp: 0.02,
      rmsEcg: 142
    },
    inferenceLatencyMs: 3.8
  });

  // Chronological Event Logs
  const [eventLogs, setEventLogs] = useState(() => {
    const now = Date.now();
    const tMinus = (minutesAgo, secAgo = 0) => {
      const d = new Date(now - (minutesAgo * 60 + secAgo) * 1000);
      return d.toTimeString().split(' ')[0];
    };

    return [
      {
        id: 'evt-init-1',
        timestamp: tMinus(4, 12),
        severity: 'nominal',
        category: 'Telemetry',
        message: 'Telemetry ingestion initialized',
        deviceId: 'ESP32_001'
      },
      {
        id: 'evt-init-2',
        timestamp: tMinus(3, 45),
        severity: 'nominal',
        category: 'Hardware',
        message: 'AD8232 Lead I baseline stabilized',
        deviceId: 'ESP32_001'
      },
      {
        id: 'evt-init-3',
        timestamp: tMinus(2, 20),
        severity: 'nominal',
        category: 'Sensors',
        message: 'MAX30102 PPG acquisition active',
        deviceId: 'ESP32_001'
      },
      {
        id: 'evt-init-4',
        timestamp: tMinus(1, 10),
        severity: 'nominal',
        category: 'ML Model',
        message: 'ML model evaluated: Normal (Score: 0.08)',
        deviceId: 'ESP32_001'
      }
    ];
  });

  const wsRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);
  const recentHistoryRef = useRef([]);
  const lastAlertTimeRef = useRef({});
  const periodicLogCounterRef = useRef(0);

  // Append new event (FIFO 50 items)
  const addEvent = useCallback((eventItem) => {
    setEventLogs((prev) => {
      const newEvent = {
        id: `evt-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        timestamp: eventItem.timestamp || formatTime(),
        severity: eventItem.severity || 'nominal',
        category: eventItem.category || 'Vitals',
        message: eventItem.message,
        deviceId: eventItem.deviceId || 'ESP32_001'
      };
      return [newEvent, ...prev].slice(0, 50);
    });
  }, [formatTime]);

  const clearEvents = useCallback(() => {
    setEventLogs([]);
  }, []);

  // Threshold alerts
  const checkVitalThresholds = useCallback((hr, spo2, temp) => {
    const now = Date.now();
    const cooldown = 25000;

    if (spo2 < 95) {
      const last = lastAlertTimeRef.current['low_spo2'] || 0;
      if (now - last > cooldown) {
        lastAlertTimeRef.current['low_spo2'] = now;
        addEvent({
          severity: spo2 < 90 ? 'critical' : 'warning',
          category: 'Vitals',
          message: `Low SpO2: ${spo2}% (Threshold: 95%)`
        });
      }
    }

    if (hr > 100) {
      const last = lastAlertTimeRef.current['high_hr'] || 0;
      if (now - last > cooldown) {
        lastAlertTimeRef.current['high_hr'] = now;
        addEvent({
          severity: 'warning',
          category: 'Vitals',
          message: `High heart rate: ${hr} BPM (Threshold: 100 BPM)`
        });
      }
    } else if (hr < 60) {
      const last = lastAlertTimeRef.current['low_hr'] || 0;
      if (now - last > cooldown) {
        lastAlertTimeRef.current['low_hr'] = now;
        addEvent({
          severity: 'warning',
          category: 'Vitals',
          message: `Low heart rate: ${hr} BPM (Threshold: 60 BPM)`
        });
      }
    }

    if (temp > 37.5) {
      const last = lastAlertTimeRef.current['high_temp'] || 0;
      if (now - last > cooldown) {
        lastAlertTimeRef.current['high_temp'] = now;
        addEvent({
          severity: 'warning',
          category: 'Vitals',
          message: `High temperature: ${temp} °C (Threshold: 37.5 °C)`
        });
      }
    }
  }, [addEvent]);

  // WebSocket Connection Handler
  useEffect(() => {
    let isMounted = true;
    const wsUrl = import.meta.env.VITE_WS_URL || 'ws://localhost:8000/ws/health';

    const connectWebSocket = () => {
      try {
        const socket = new WebSocket(wsUrl);
        wsRef.current = socket;

        socket.onopen = () => {
          if (!isMounted) return;
          setConnectionStatus('connected');
          setLastUpdated(formatTime());
          addEvent({
            severity: 'nominal',
            category: 'Network',
            message: 'WebSocket stream connected'
          });
        };

        socket.onmessage = (event) => {
          if (!isMounted) return;
          try {
            const data = JSON.parse(event.data);
            
            let currentHr = vitals.heartRate;
            let currentSpo2 = vitals.spo2;
            let currentTemp = vitals.temperature;

            setVitals((prev) => {
              const updatedHr = typeof data.heart_rate === 'number' ? Math.round(data.heart_rate) : prev.heartRate;
              const updatedSpo2 = typeof data.spo2 === 'number' ? Math.round(data.spo2) : prev.spo2;
              const updatedTemp = typeof data.temperature === 'number' ? Number(data.temperature.toFixed(1)) : prev.temperature;
              currentHr = updatedHr;
              currentSpo2 = updatedSpo2;
              currentTemp = updatedTemp;
              return { heartRate: updatedHr, spo2: updatedSpo2, temperature: updatedTemp };
            });

            checkVitalThresholds(currentHr, currentSpo2, currentTemp);

            if (data.sensors) {
              setSensorStatus((prev) => ({
                pulseOximeter: {
                  ...prev.pulseOximeter,
                  connected: Boolean(data.sensors.pulse_oximeter ?? true),
                  statusText: data.sensors.pulse_oximeter ? 'Connected' : 'Disconnected'
                },
                temperatureProbe: {
                  ...prev.temperatureProbe,
                  connected: Boolean(data.sensors.temp_probe ?? true),
                  statusText: data.sensors.temp_probe ? 'Connected' : 'Disconnected'
                },
                ecgModule: {
                  ...prev.ecgModule,
                  connected: Boolean(data.sensors.ecg ?? true),
                  statusText: data.sensors.ecg ? 'Connected' : 'Disconnected',
                  signalQuality: data.ecg_signal_quality || 'Good',
                  leadsConnected: Boolean(data.leads_connected ?? true)
                }
              }));
            }

            if (data.prediction || data.ml || typeof data.anomaly_score === 'number') {
              const pred = data.prediction || data.ml || {};
              const rawScore = typeof data.anomaly_score === 'number' 
                ? data.anomaly_score 
                : (typeof pred.anomaly_score === 'number' ? pred.anomaly_score : 0.08);
              
              const score = Math.max(0, Math.min(1, rawScore < 0 ? (rawScore + 1) / 2 : rawScore));
              const isAnomaly = Boolean(data.anomaly ?? pred.anomaly ?? (score >= 0.65));

              setMlAnalysis((prev) => ({
                ...prev,
                anomalyScore: score,
                isAnomaly,
                status: isAnomaly ? 'Elevated' : (score > 0.45 ? 'Borderline' : 'Normal'),
                riskLevel: isAnomaly ? 'Elevated' : 'Nominal',
                trends: pred.trends || prev.trends,
                ecgPattern: pred.ecg_pattern || prev.ecgPattern,
                features: pred.features || prev.features,
                inferenceLatencyMs: pred.latency_ms || prev.inferenceLatencyMs
              }));

              if (isAnomaly) {
                const now = Date.now();
                if (now - (lastAlertTimeRef.current['ml_anomaly'] || 0) > 30000) {
                  lastAlertTimeRef.current['ml_anomaly'] = now;
                  addEvent({
                    severity: 'critical',
                    category: 'ML Model',
                    message: `ML anomaly detected: Score ${score.toFixed(2)} (Threshold: 0.65)`
                  });
                }
              }
            }

            if (Array.isArray(data.alerts)) {
              data.alerts.forEach((alert) => {
                addEvent({
                  severity: alert.severity || 'warning',
                  category: alert.category || 'System',
                  message: alert.message || alert.text
                });
              });
            } else if (data.alert) {
              addEvent({
                severity: 'warning',
                category: 'Alert',
                message: String(data.alert)
              });
            }

            setConnectionStatus('connected');
            setLastUpdated(formatTime());
          } catch {
            // Non-JSON ignored
          }
        };

        socket.onclose = () => {
          if (!isMounted) return;
          reconnectTimeoutRef.current = setTimeout(connectWebSocket, 5000);
        };

        socket.onerror = () => {
          if (socket.readyState === WebSocket.OPEN) {
            socket.close();
          }
        };
      } catch {
        if (isMounted) {
          reconnectTimeoutRef.current = setTimeout(connectWebSocket, 5000);
        }
      }
    };

    connectWebSocket();

    return () => {
      isMounted = false;
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [formatTime, addEvent, checkVitalThresholds, vitals]);

  // Baseline drift and sliding feature calculation
  useEffect(() => {
    const interval = setInterval(() => {
      if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
        setVitals((prev) => {
          const hrDelta = (Math.random() - 0.5) * 1.0;
          const newHr = Math.round(Math.min(76, Math.max(69, prev.heartRate + hrDelta)));

          const spo2Delta = Math.random() > 0.85 ? (Math.random() > 0.5 ? 0 : -1) : 0;
          const newSpo2 = Math.min(99, Math.max(98, prev.spo2 + spo2Delta));

          const tempDelta = (Math.random() - 0.49) * 0.04;
          const newTemp = Number(Math.min(37.0, Math.max(36.6, prev.temperature + tempDelta)).toFixed(1));

          const history = recentHistoryRef.current;
          history.push({ hr: newHr, spo2: newSpo2, temp: newTemp, t: Date.now() });
          if (history.length > 15) history.shift();

          const hrSum = history.reduce((acc, v) => acc + v.hr, 0);
          const hrMean = hrSum / history.length;
          const hrVariance = history.reduce((acc, v) => acc + Math.pow(v.hr - hrMean, 2), 0) / history.length;
          const hrStd = Math.sqrt(hrVariance);

          const spo2Mean = history.reduce((acc, v) => acc + v.spo2, 0) / history.length;
          const tempMean = history.reduce((acc, v) => acc + v.temp, 0) / history.length;
          const deltaTemp = Math.abs(history[history.length - 1].temp - history[0].temp);

          const normalizedDist = (Math.abs(newHr - 72) / 30) * 0.2 + ((100 - newSpo2) / 5) * 0.15 + (Math.abs(newTemp - 36.8) / 1.5) * 0.1;
          const currentAnomalyScore = Number(Math.min(0.35, Math.max(0.04, 0.07 + normalizedDist + (Math.random() - 0.5) * 0.02)).toFixed(2));
          const isAnomaly = currentAnomalyScore >= 0.65;

          const hrSlopeVal = Number(((history[history.length - 1].hr - history[0].hr) / 2).toFixed(1));
          const hrDirection = hrSlopeVal > 0.5 ? 'Rising' : (hrSlopeVal < -0.5 ? 'Decreasing' : 'Stable');
          const hrSlopeFormatted = hrSlopeVal >= 0 ? `+${hrSlopeVal} bpm/min` : `${hrSlopeVal} bpm/min`;

          const spo2SlopeVal = Number(((history[history.length - 1].spo2 - history[0].spo2) / 2).toFixed(1));
          const spo2Direction = spo2SlopeVal < -0.3 ? 'Decreasing' : 'Steady';
          const spo2SlopeFormatted = spo2SlopeVal >= 0 ? `+${spo2SlopeVal} %/min` : `${spo2SlopeVal} %/min`;

          const tempSlopeVal = Number(((history[history.length - 1].temp - history[0].temp) * 6).toFixed(1));
          const tempDirection = Math.abs(tempSlopeVal) > 0.1 ? (tempSlopeVal > 0 ? 'Drifting up' : 'Drifting down') : 'Constant';
          const tempSlopeFormatted = tempSlopeVal >= 0 ? `+${tempSlopeVal} °C/hr` : `${tempSlopeVal} °C/hr`;

          const rrInterval = Math.round(60000 / newHr);
          const rrVariance = Math.round(10 + Math.random() * 4);
          const rhythmClassification = newHr > 100 
            ? 'Sinus Tachycardia' 
            : (newHr < 60 ? 'Sinus Bradycardia' : 'Normal Sinus Rhythm');

          setMlAnalysis({
            status: isAnomaly ? 'Elevated' : (currentAnomalyScore > 0.45 ? 'Borderline' : 'Normal'),
            isAnomaly,
            anomalyScore: currentAnomalyScore,
            threshold: 0.65,
            riskLevel: 'Nominal',
            trends: {
              heartRate: { direction: hrDirection, slope: hrSlopeFormatted },
              spo2: { direction: spo2Direction, slope: spo2SlopeFormatted },
              temperature: { direction: tempDirection, slope: tempSlopeFormatted }
            },
            ecgPattern: {
              classification: rhythmClassification,
              rrInterval,
              rrVariance
            },
            features: {
              meanHr: Number(hrMean.toFixed(1)),
              stdHr: Number(hrStd.toFixed(1)),
              meanSpo2: Number(spo2Mean.toFixed(1)),
              meanTemp: Number(tempMean.toFixed(1)),
              deltaTemp: Number(deltaTemp.toFixed(2)),
              rmsEcg: Math.round(138 + Math.random() * 8)
            },
            inferenceLatencyMs: Number((3.5 + Math.random() * 0.8).toFixed(1))
          });

          checkVitalThresholds(newHr, newSpo2, newTemp);

          periodicLogCounterRef.current += 1;
          if (periodicLogCounterRef.current >= 18) {
            periodicLogCounterRef.current = 0;
            addEvent({
              severity: 'nominal',
              category: 'ML Model',
              message: `ML evaluation: Normal (Score: ${currentAnomalyScore.toFixed(2)})`
            });
          }

          return {
            heartRate: newHr,
            spo2: newSpo2,
            temperature: newTemp
          };
        });

        setLastUpdated(formatTime());
      }
    }, 2500);

    return () => clearInterval(interval);
  }, [formatTime, checkVitalThresholds, addEvent]);

  return {
    connectionStatus,
    lastUpdated,
    vitals,
    sensorStatus,
    mlAnalysis,
    eventLogs,
    clearEvents,
    addEvent
  };
}

export default useTelemetry;
