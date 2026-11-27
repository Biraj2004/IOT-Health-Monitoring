import { useState, useEffect, useRef, useCallback } from 'react';
import {
  buildWebSocketUrl,
  fetchAlerts,
  fetchBackendHealth,
  fetchDevices,
  fetchLatestReading,
} from '../services/api';

const IS_DEMO_FALLBACK_ENABLED =
  import.meta.env.VITE_ENABLE_DEMO_FALLBACK === 'true';
const INITIAL_DEVICE_FILTER = (import.meta.env.VITE_DEVICE_ID || '').trim();
const MAX_EVENTS = 50;
const PING_INTERVAL_MS = 25000;
const RECONNECT_DELAYS_MS = [1000, 2000, 5000];

const EMPTY_VITALS = {
  heartRate: null,
  spo2: null,
  temperature: null,
};

function createIdleSensors(statusText = 'Awaiting data') {
  return {
    pulseOximeter: {
      name: 'Pulse oximeter',
      connected: false,
      statusText,
    },
    temperatureProbe: {
      name: 'Temperature probe',
      connected: false,
      statusText,
    },
    ecgModule: {
      name: 'ECG module',
      connected: false,
      statusText,
      signalQuality: 'No signal',
      leadsConnected: false,
    },
  };
}

function createDemoSensors() {
  return {
    pulseOximeter: {
      name: 'Pulse oximeter',
      connected: true,
      statusText: 'Connected',
    },
    temperatureProbe: {
      name: 'Temperature probe',
      connected: true,
      statusText: 'Connected',
    },
    ecgModule: {
      name: 'ECG module',
      connected: true,
      statusText: 'Connected',
      signalQuality: 'Good',
      leadsConnected: true,
    },
  };
}

function normalizeScore(rawScore) {
  if (typeof rawScore !== 'number' || Number.isNaN(rawScore)) {
    return null;
  }
  const bounded = rawScore < 0 ? (rawScore + 1) / 2 : rawScore;
  return Number(Math.max(0, Math.min(1, bounded)).toFixed(2));
}

function buildMlState(data, prevMl) {
  const pred = data.prediction || data.ml || null;
  const rawScore =
    typeof data.anomaly_score === 'number'
      ? data.anomaly_score
      : pred && typeof pred.anomaly_score === 'number'
      ? pred.anomaly_score
      : null;

  if (!pred && rawScore === null) {
    return prevMl;
  }

  const score = normalizeScore(rawScore) ?? prevMl?.anomalyScore ?? 0;
  const threshold =
    pred && typeof pred.threshold === 'number'
      ? pred.threshold
      : prevMl?.threshold ?? 0.65;
  const isAnomaly = Boolean(data.anomaly ?? pred?.anomaly ?? score >= threshold);
  const status =
    pred?.status ||
    (isAnomaly ? 'Elevated' : score > 0.45 ? 'Borderline' : 'Normal');
  const riskLevel =
    pred?.risk_level ||
    (isAnomaly ? 'Elevated' : score > 0.45 ? 'Borderline' : 'Nominal');

  return {
    status,
    isAnomaly,
    anomalyScore: score,
    threshold,
    riskLevel,
    trends: pred?.trends || prevMl?.trends || null,
    ecgPattern: pred?.ecg_pattern || prevMl?.ecgPattern || null,
    features: pred?.features || prevMl?.features || null,
    inferenceLatencyMs:
      pred && typeof pred.latency_ms === 'number'
        ? pred.latency_ms
        : prevMl?.inferenceLatencyMs ?? 0,
  };
}

/**
 * Custom Hook: useTelemetry
 * Coordinates REST bootstrap hydration, real-time WebSocket streaming,
 * hardware sensor states, ML inference metrics, and clinical event alerts.
 */
export function useTelemetry() {
  const [connectionStatus, setConnectionStatus] = useState('reconnecting'); // 'connected' | 'reconnecting' | 'disconnected'
  const [dataSource, setDataSource] = useState(
    IS_DEMO_FALLBACK_ENABLED ? 'demo' : 'unavailable'
  ); // 'live' | 'snapshot' | 'demo' | 'unavailable'
  const [backendMeta, setBackendMeta] = useState({
    reachable: false,
    database: 'unknown',
    version: null,
  });

  const [selectedDeviceId, setSelectedDeviceId] = useState(INITIAL_DEVICE_FILTER);
  const [activeDeviceId, setActiveDeviceId] = useState(
    INITIAL_DEVICE_FILTER || 'ESP32_001'
  );
  const [devices, setDevices] = useState([]);

  const formatTime = useCallback((value) => {
    const dateObj =
      value instanceof Date ? value : value ? new Date(value) : new Date();
    if (Number.isNaN(dateObj.getTime())) {
      return new Date().toTimeString().split(' ')[0];
    }
    return dateObj.toTimeString().split(' ')[0];
  }, []);

  const [lastUpdated, setLastUpdated] = useState(null);
  const [vitals, setVitals] = useState(() =>
    IS_DEMO_FALLBACK_ENABLED
      ? { heartRate: 72, spo2: 99, temperature: 36.8 }
      : EMPTY_VITALS
  );
  const [sensorStatus, setSensorStatus] = useState(() =>
    IS_DEMO_FALLBACK_ENABLED ? createDemoSensors() : createIdleSensors()
  );
  const [mlAnalysis, setMlAnalysis] = useState(null);
  const [ecgStream, setEcgStream] = useState({ samples: [], batchId: 0 });
  const [eventLogs, setEventLogs] = useState([]);

  const wsRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);
  const reconnectAttemptsRef = useRef(0);
  const pingIntervalRef = useRef(null);
  const selectedDeviceRef = useRef(selectedDeviceId);
  const seenAlertKeysRef = useRef(new Set());
  const lastPayloadKeyRef = useRef('');
  const recentHistoryRef = useRef([]);
  const lastAlertTimeRef = useRef({});
  const periodicLogCounterRef = useRef(0);

  useEffect(() => {
    selectedDeviceRef.current = selectedDeviceId;
  }, [selectedDeviceId]);

  const appendEvents = useCallback(
    (items) => {
      if (!Array.isArray(items) || items.length === 0) return;

      setEventLogs((prev) => {
        const additions = [];
        for (const item of items) {
          if (!item || !item.message) continue;
          const rawTs = item.rawTimestamp || item.timestamp || '';
          const devId = item.deviceId || 'ESP32_001';
          const category = item.category || 'Telemetry';
          const dedupeKey = item.dedupe
            ? `${devId}|${rawTs}|${category}|${item.message}`
            : null;

          if (dedupeKey) {
            if (seenAlertKeysRef.current.has(dedupeKey)) {
              continue;
            }
            seenAlertKeysRef.current.add(dedupeKey);
            if (seenAlertKeysRef.current.size > 400) {
              const firstKey = seenAlertKeysRef.current.values().next().value;
              seenAlertKeysRef.current.delete(firstKey);
            }
          }

          additions.push({
            id:
              item.id ||
              `evt-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
            timestamp: formatTime(item.timestamp),
            severity: item.severity || 'nominal',
            category,
            message: item.message,
            deviceId: devId,
          });
        }

        if (additions.length === 0) {
          return prev;
        }
        return [...additions, ...prev].slice(0, MAX_EVENTS);
      });
    },
    [formatTime]
  );

  const addEvent = useCallback(
    (eventItem) => {
      appendEvents([eventItem]);
    },
    [appendEvents]
  );

  const clearEvents = useCallback(() => {
    setEventLogs([]);
  }, []);

  const registerSeenDevice = useCallback((deviceId) => {
    if (!deviceId) return;
    setDevices((prev) => {
      if (prev.some((d) => d.device_id === deviceId)) {
        return prev;
      }
      return [...prev, { device_id: deviceId, status: 'online' }];
    });
  }, []);

  const applyTelemetryPayload = useCallback(
    (data, source = 'live') => {
      if (!data || typeof data !== 'object') return;

      const payloadDeviceId = data.device_id || 'ESP32_001';
      registerSeenDevice(payloadDeviceId);

      // If filtering to a specific device, ignore telemetry from other nodes
      if (
        selectedDeviceRef.current &&
        payloadDeviceId !== selectedDeviceRef.current
      ) {
        return;
      }

      setActiveDeviceId(payloadDeviceId);
      setDataSource(source);

      setVitals((prev) => ({
        heartRate:
          typeof data.heart_rate === 'number'
            ? Math.round(data.heart_rate)
            : prev.heartRate,
        spo2:
          typeof data.spo2 === 'number' ? Math.round(data.spo2) : prev.spo2,
        temperature:
          typeof data.temperature === 'number'
            ? Number(data.temperature.toFixed(1))
            : prev.temperature,
      }));

      const rawSensors = data.sensors || {};
      const pulseConnected = Boolean(rawSensors.pulse_oximeter ?? true);
      const tempConnected = Boolean(rawSensors.temp_probe ?? true);
      const ecgConnected = Boolean(rawSensors.ecg ?? true);
      const leadsConnected = Boolean(data.leads_connected ?? ecgConnected);

      setSensorStatus({
        pulseOximeter: {
          name: 'Pulse oximeter',
          connected: pulseConnected,
          statusText: pulseConnected ? 'Connected' : 'Disconnected',
        },
        temperatureProbe: {
          name: 'Temperature probe',
          connected: tempConnected,
          statusText: tempConnected ? 'Connected' : 'Disconnected',
        },
        ecgModule: {
          name: 'ECG module',
          connected: ecgConnected,
          statusText: ecgConnected ? 'Connected' : 'Disconnected',
          signalQuality: data.ecg_signal_quality || (leadsConnected ? 'Good' : 'Leads Off'),
          leadsConnected,
        },
      });

      setMlAnalysis((prev) => buildMlState(data, prev));

      if (Array.isArray(data.ecg_samples) && data.ecg_samples.length > 0) {
        setEcgStream((prev) => ({
          samples: data.ecg_samples,
          batchId: prev.batchId + 1,
        }));
      }

      const payloadTimestamp = data.timestamp || '';
      const payloadKey = `${payloadDeviceId}|${payloadTimestamp}`;
      const isNewPayload = payloadKey !== lastPayloadKeyRef.current;
      lastPayloadKeyRef.current = payloadKey;

      if (isNewPayload && Array.isArray(data.alerts) && data.alerts.length > 0) {
        appendEvents(
          data.alerts
            .slice()
            .reverse()
            .map((alert) => ({
              severity: alert.severity || 'warning',
              category: alert.category || 'System',
              message: alert.message || alert.text,
              deviceId: payloadDeviceId,
              timestamp: payloadTimestamp || undefined,
              rawTimestamp: payloadTimestamp,
              dedupe: true,
            }))
        );
      } else if (isNewPayload && data.alert) {
        appendEvents([
          {
            severity: 'warning',
            category: 'Alert',
            message: String(data.alert),
            deviceId: payloadDeviceId,
            timestamp: payloadTimestamp || undefined,
            rawTimestamp: payloadTimestamp,
            dedupe: true,
          },
        ]);
      }

      setLastUpdated(formatTime(payloadTimestamp || undefined));
    },
    [appendEvents, formatTime, registerSeenDevice]
  );

  // Initial & device-change REST bootstrap hydration
  useEffect(() => {
    const controller = new AbortController();
    const deviceFilter = selectedDeviceId || undefined;

    async function hydrateFromBackend() {
      const [healthRes, devicesRes, latestRes, alertsRes] =
        await Promise.allSettled([
          fetchBackendHealth({ signal: controller.signal }),
          fetchDevices({ signal: controller.signal }),
          fetchLatestReading({
            deviceId: deviceFilter,
            signal: controller.signal,
          }),
          fetchAlerts({
            limit: MAX_EVENTS,
            deviceId: deviceFilter,
            signal: controller.signal,
          }),
        ]);

      if (controller.signal.aborted) return;

      if (healthRes.status === 'fulfilled' && healthRes.value) {
        setBackendMeta({
          reachable: true,
          database: healthRes.value.database || 'in-memory',
          version: healthRes.value.version || null,
        });
      }

      if (devicesRes.status === 'fulfilled' && Array.isArray(devicesRes.value)) {
        setDevices(devicesRes.value);
        if (!deviceFilter && devicesRes.value.length > 0) {
          setActiveDeviceId(devicesRes.value[0].device_id);
        }
      }

      if (alertsRes.status === 'fulfilled' && alertsRes.value?.alerts) {
        const hydratedAlerts = alertsRes.value.alerts.map((alert, idx) => {
          const rawTs = alert.timestamp || alert.created_at || '';
          const devId = alert.device_id || deviceFilter || 'ESP32_001';
          const category = alert.category || 'System';
          const message = alert.message || alert.text || '';
          const key = `${devId}|${rawTs}|${category}|${message}`;
          seenAlertKeysRef.current.add(key);

          return {
            id: alert.id || `hist-${idx}-${rawTs}`,
            timestamp: formatTime(rawTs || undefined),
            severity: alert.severity || 'warning',
            category,
            message,
            deviceId: devId,
          };
        });
        setEventLogs((prev) => {
          if (deviceFilter) {
            return hydratedAlerts.slice(0, MAX_EVENTS);
          }
          const hydratedKeys = new Set(
            hydratedAlerts.map(
              (e) => `${e.deviceId}|${e.timestamp}|${e.category}|${e.message}`
            )
          );
          const newerLive = prev.filter(
            (e) =>
              !hydratedKeys.has(
                `${e.deviceId}|${e.timestamp}|${e.category}|${e.message}`
              )
          );
          return [...newerLive, ...hydratedAlerts].slice(0, MAX_EVENTS);
        });
      }

      if (
        latestRes.status === 'fulfilled' &&
        latestRes.value &&
        (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN)
      ) {
        applyTelemetryPayload(latestRes.value, 'snapshot');
      } else if (deviceFilter && (!latestRes.value || latestRes.status !== 'fulfilled')) {
        setVitals(EMPTY_VITALS);
        setMlAnalysis(null);
        setEcgStream((prev) => ({ samples: [], batchId: prev.batchId + 1 }));
        setSensorStatus(createIdleSensors('Awaiting data'));
      }
    }

    hydrateFromBackend();

    return () => {
      controller.abort();
    };
  }, [selectedDeviceId, applyTelemetryPayload, formatTime]);

  // Persistent WebSocket stream with ping/pong keepalive and bounded backoff
  useEffect(() => {
    let isMounted = true;
    const wsUrl = buildWebSocketUrl();

    const clearSocketTimers = () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
      if (pingIntervalRef.current) {
        clearInterval(pingIntervalRef.current);
        pingIntervalRef.current = null;
      }
    };

    const scheduleReconnect = () => {
      if (!isMounted) return;
      const attempt = reconnectAttemptsRef.current;
      const delay =
        RECONNECT_DELAYS_MS[Math.min(attempt, RECONNECT_DELAYS_MS.length - 1)];
      reconnectAttemptsRef.current += 1;

      setConnectionStatus(attempt >= 2 ? 'disconnected' : 'reconnecting');
      if (attempt >= 2 && !IS_DEMO_FALLBACK_ENABLED) {
        setSensorStatus((prev) => ({
          pulseOximeter: {
            ...prev.pulseOximeter,
            connected: false,
            statusText: 'Offline',
          },
          temperatureProbe: {
            ...prev.temperatureProbe,
            connected: false,
            statusText: 'Offline',
          },
          ecgModule: {
            ...prev.ecgModule,
            connected: false,
            statusText: 'Offline',
            signalQuality: 'No signal',
          },
        }));
      }

      reconnectTimeoutRef.current = setTimeout(connectWebSocket, delay);
    };

    const connectWebSocket = () => {
      if (!isMounted) return;
      clearSocketTimers();
      setConnectionStatus(
        reconnectAttemptsRef.current >= 2 ? 'disconnected' : 'reconnecting'
      );

      try {
        const socket = new WebSocket(wsUrl);
        wsRef.current = socket;

        socket.onopen = () => {
          if (!isMounted) return;
          reconnectAttemptsRef.current = 0;
          setConnectionStatus('connected');
          setBackendMeta((prev) => ({ ...prev, reachable: true }));
          addEvent({
            severity: 'nominal',
            category: 'Network',
            message: 'WebSocket stream connected',
            deviceId: selectedDeviceRef.current || 'Backend',
          });

          pingIntervalRef.current = setInterval(() => {
            if (socket.readyState === WebSocket.OPEN) {
              socket.send(JSON.stringify({ type: 'ping' }));
            }
          }, PING_INTERVAL_MS);
        };

        socket.onmessage = (event) => {
          if (!isMounted) return;
          try {
            const data = JSON.parse(event.data);
            if (!data || data.type === 'pong') {
              return;
            }
            setConnectionStatus('connected');
            applyTelemetryPayload(data, 'live');
          } catch {
            // Non-JSON frame ignored
          }
        };

        socket.onclose = () => {
          if (!isMounted) return;
          clearSocketTimers();
          if (wsRef.current === socket) {
            wsRef.current = null;
          }
          scheduleReconnect();
        };

        socket.onerror = () => {
          if (socket.readyState === WebSocket.OPEN) {
            socket.close();
          }
        };
      } catch {
        scheduleReconnect();
      }
    };

    connectWebSocket();

    return () => {
      isMounted = false;
      clearSocketTimers();
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, [addEvent, applyTelemetryPayload]);

  // Opt-in offline demo simulation (only active when VITE_ENABLE_DEMO_FALLBACK=true)
  useEffect(() => {
    if (!IS_DEMO_FALLBACK_ENABLED) return undefined;

    const checkDemoThresholds = (hr, spo2, temp) => {
      const now = Date.now();
      const cooldown = 25000;
      if (spo2 < 95 && now - (lastAlertTimeRef.current.low_spo2 || 0) > cooldown) {
        lastAlertTimeRef.current.low_spo2 = now;
        addEvent({
          severity: spo2 < 90 ? 'critical' : 'warning',
          category: 'Vitals',
          message: `Low SpO2: ${spo2}% (Threshold: 95%)`,
        });
      }
      if (hr > 100 && now - (lastAlertTimeRef.current.high_hr || 0) > cooldown) {
        lastAlertTimeRef.current.high_hr = now;
        addEvent({
          severity: 'warning',
          category: 'Vitals',
          message: `High heart rate: ${hr} BPM (Threshold: 100 BPM)`,
        });
      }
      if (temp > 37.5 && now - (lastAlertTimeRef.current.high_temp || 0) > cooldown) {
        lastAlertTimeRef.current.high_temp = now;
        addEvent({
          severity: 'warning',
          category: 'Vitals',
          message: `High temperature: ${temp} °C (Threshold: 37.5 °C)`,
        });
      }
    };

    const interval = setInterval(() => {
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        return;
      }

      setDataSource('demo');
      setSensorStatus(createDemoSensors());
      setVitals((prev) => {
        const baseHr = typeof prev.heartRate === 'number' ? prev.heartRate : 72;
        const baseSpo2 = typeof prev.spo2 === 'number' ? prev.spo2 : 99;
        const baseTemp =
          typeof prev.temperature === 'number' ? prev.temperature : 36.8;

        const newHr = Math.round(
          Math.min(76, Math.max(69, baseHr + (Math.random() - 0.5) * 1.0))
        );
        const spo2Delta =
          Math.random() > 0.85 ? (Math.random() > 0.5 ? 0 : -1) : 0;
        const newSpo2 = Math.min(99, Math.max(98, baseSpo2 + spo2Delta));
        const newTemp = Number(
          Math.min(
            37.0,
            Math.max(36.6, baseTemp + (Math.random() - 0.49) * 0.04)
          ).toFixed(1)
        );

        const history = recentHistoryRef.current;
        history.push({ hr: newHr, spo2: newSpo2, temp: newTemp });
        if (history.length > 15) history.shift();

        const hrMean = history.reduce((acc, v) => acc + v.hr, 0) / history.length;
        const hrStd = Math.sqrt(
          history.reduce((acc, v) => acc + Math.pow(v.hr - hrMean, 2), 0) /
            history.length
        );
        const spo2Mean =
          history.reduce((acc, v) => acc + v.spo2, 0) / history.length;
        const tempMean =
          history.reduce((acc, v) => acc + v.temp, 0) / history.length;
        const deltaTemp = Math.abs(
          history[history.length - 1].temp - history[0].temp
        );
        const currentAnomalyScore = Number(
          Math.min(
            0.35,
            Math.max(
              0.04,
              0.07 +
                (Math.abs(newHr - 72) / 30) * 0.2 +
                ((100 - newSpo2) / 5) * 0.15 +
                (Math.random() - 0.5) * 0.02
            )
          ).toFixed(2)
        );

        setMlAnalysis({
          status: 'Normal',
          isAnomaly: false,
          anomalyScore: currentAnomalyScore,
          threshold: 0.65,
          riskLevel: 'Nominal',
          trends: {
            heartRate: { direction: 'Stable', slope: '+0.0 bpm/min' },
            spo2: { direction: 'Steady', slope: '0.0 %/min' },
            temperature: { direction: 'Constant', slope: '+0.0 °C/hr' },
          },
          ecgPattern: {
            classification: 'Normal Sinus Rhythm',
            rrInterval: Math.round(60000 / newHr),
            rrVariance: Math.round(10 + Math.random() * 4),
          },
          features: {
            meanHr: Number(hrMean.toFixed(1)),
            stdHr: Number(hrStd.toFixed(1)),
            meanSpo2: Number(spo2Mean.toFixed(1)),
            meanTemp: Number(tempMean.toFixed(1)),
            deltaTemp: Number(deltaTemp.toFixed(2)),
            rmsEcg: Math.round(138 + Math.random() * 8),
          },
          inferenceLatencyMs: Number((3.5 + Math.random() * 0.8).toFixed(1)),
        });

        checkDemoThresholds(newHr, newSpo2, newTemp);

        periodicLogCounterRef.current += 1;
        if (periodicLogCounterRef.current >= 18) {
          periodicLogCounterRef.current = 0;
          addEvent({
            severity: 'nominal',
            category: 'ML Model',
            message: `Demo evaluation: Normal (Score: ${currentAnomalyScore.toFixed(2)})`,
          });
        }

        return { heartRate: newHr, spo2: newSpo2, temperature: newTemp };
      });

      setLastUpdated(formatTime());
    }, 2500);

    return () => clearInterval(interval);
  }, [addEvent, formatTime]);

  return {
    connectionStatus,
    dataSource,
    backendMeta,
    lastUpdated,
    vitals,
    sensorStatus,
    mlAnalysis,
    ecgSamples: ecgStream.samples,
    ecgBatchId: ecgStream.batchId,
    deviceId: activeDeviceId,
    selectedDeviceId,
    onSelectDevice: setSelectedDeviceId,
    devices,
    eventLogs,
    clearEvents,
    addEvent,
  };
}

export default useTelemetry;
