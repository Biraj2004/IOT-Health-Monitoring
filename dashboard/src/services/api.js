/**
 * REST API & WebSocket URL client for the SmartHealth IoT FastAPI backend.
 */

const DEFAULT_TIMEOUT_MS = 6000;

export function getApiBaseUrl() {
  const configured = (import.meta.env.VITE_API_BASE_URL || '').trim();
  return configured.replace(/\/+$/, '');
}

export function buildApiUrl(path, params = {}) {
  const base = getApiBaseUrl();
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  const search = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      search.set(key, String(value));
    }
  });

  const query = search.toString();
  return `${base}${normalizedPath}${query ? `?${query}` : ''}`;
}

export function buildWebSocketUrl() {
  const configuredWs = (import.meta.env.VITE_WS_URL || '').trim();
  const apiBase = getApiBaseUrl();
  const wsToken = (import.meta.env.VITE_WS_TOKEN || '').trim();

  let rawUrl = configuredWs;
  if (!rawUrl) {
    if (apiBase) {
      const wsBase = apiBase.replace(/^http/i, 'ws');
      rawUrl = `${wsBase}/ws/health`;
    } else if (typeof window !== 'undefined') {
      const wsProto = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      rawUrl = `${wsProto}//${window.location.host}/ws/health`;
    } else {
      rawUrl = 'ws://127.0.0.1:8000/ws/health';
    }
  }

  try {
    const origin =
      typeof window !== 'undefined' ? window.location.origin : 'http://127.0.0.1:8000';
    const url = new URL(rawUrl, origin);
    if (wsToken && !url.searchParams.has('token')) {
      url.searchParams.set('token', wsToken);
    }
    return url.toString();
  } catch {
    return rawUrl;
  }
}

async function requestJson(
  path,
  { params = {}, signal, timeoutMs = DEFAULT_TIMEOUT_MS, allowNotFound = false } = {}
) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  const onAbort = () => controller.abort();
  if (signal) {
    if (signal.aborted) {
      clearTimeout(timer);
      controller.abort();
    } else {
      signal.addEventListener('abort', onAbort, { once: true });
    }
  }

  try {
    const response = await fetch(buildApiUrl(path, params), {
      method: 'GET',
      headers: { Accept: 'application/json' },
      signal: controller.signal,
    });

    if (allowNotFound && response.status === 404) {
      return null;
    }

    if (!response.ok) {
      throw new Error(`HTTP ${response.status} from ${path}`);
    }

    const contentType = response.headers.get('content-type') || '';
    if (!contentType.includes('application/json')) {
      throw new Error(`Expected JSON from ${path}, received '${contentType || 'unknown'}'`);
    }

    return await response.json();
  } finally {
    clearTimeout(timer);
    if (signal) {
      signal.removeEventListener('abort', onAbort);
    }
  }
}

export function fetchBackendHealth({ signal } = {}) {
  return requestJson('/api/health', { signal });
}

export function fetchLatestReading({ deviceId, signal } = {}) {
  return requestJson('/api/readings/latest', {
    params: { device_id: deviceId },
    signal,
    allowNotFound: true,
  });
}

export function fetchReadingHistory({ limit = 50, deviceId, signal } = {}) {
  return requestJson('/api/readings/history', {
    params: { limit, device_id: deviceId },
    signal,
  });
}

export function fetchAlerts({ limit = 50, deviceId, signal } = {}) {
  return requestJson('/api/alerts', {
    params: { limit, device_id: deviceId },
    signal,
  });
}

export function fetchDevices({ signal } = {}) {
  return requestJson('/api/devices', { signal });
}

export function fetchLatestPrediction({ signal } = {}) {
  return requestJson('/api/predictions/latest', { signal });
}
