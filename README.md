# VITAL / MONITOR

<p align="center">
  <img src="dashboard/public/favicon.svg" alt="VITAL Logo" width="80" height="80" style="border-radius: 16px;" />
</p>

<p align="center">
  <strong>Real-Time IoT Clinical Telemetry Dashboard</strong>
</p>

<p align="center">
  <a href="https://vitalmonitor.vercel.app"><img src="https://img.shields.io/badge/Live_Demo-vitalmonitor.vercel.app-008F72?style=flat-square&logo=vercel" alt="Live Demo" /></a>
  <img src="https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react&logoColor=black" alt="React 19" />
  <img src="https://img.shields.io/badge/Vite-8-646CFF?style=flat-square&logo=vite&logoColor=white" alt="Vite" />
  <img src="https://img.shields.io/badge/ESP32-DevKit-E7352C?style=flat-square&logo=espressif&logoColor=white" alt="ESP32" />
  <img src="https://img.shields.io/badge/License-MIT-gray?style=flat-square" alt="License" />
</p>

---

## Overview

**VITAL / MONITOR** is a hardware-connected physiological monitoring dashboard designed for IoT health surveillance. Adhering to the [impeccable.style](https://impeccable.style) design standard, the interface eliminates decorative clutter to prioritize clinical readability, sub-pixel grid precision, and real-time sensor fidelity.

- **Oxygen Saturation (SpO₂)**: Continuous PPG pulse oximetry via MAX30102.
- **Body Temperature**: Precision Celsius measurement via DS18B20 1-Wire probe.
- **Heart Rate**: Real-time cardiac pulse computation in beats per minute (bpm).
- **Live Lead I ECG Waveform**: Calibrated oscilloscope canvas with medical millimeter grid (`25 mm/s · 10 mm/mV`) and a 60 FPS sweep cursor.
- **Hardware Telemetry Abstraction**: Dual-mode engine supporting live WebSocket streaming (`ws://localhost:8000/ws/health`) with automatic offline drift emulation.

---

## Hardware Architecture

```text
[ MAX30102 PPG ] ──┐
[ DS18B20 Temp ] ──┼──> [ ESP32 DevKit ] ──(Wi-Fi / WS)──> [ FastAPI Backend ] ──> [ React Dashboard ]
[ AD8232 ECG   ] ──┘
```

| Sensor / Module | Parameter | Transport / Interface |
|:---|:---|:---|
| **MAX30102** | Heart Rate & SpO₂ | I²C (GPIO 21, 22) |
| **DS18B20** | Core Temperature (°C) | 1-Wire (GPIO 4, 4.7kΩ pull-up) |
| **AD8232** | ECG Bio-potential (Lead I) | ADC1_CH6 (GPIO 34) |
| **ESP32** | Gateway Microcontroller | Wi-Fi 802.11 b/g/n |

---

## Quick Start

### 1. Installation

```bash
cd dashboard
npm install
```

### 2. Run Local Development Server

```bash
npm run dev
```

Dashboard will start at `http://localhost:5173/`.

### 3. Production Build

```bash
npm run build
```

---

## Deployment

The dashboard is pre-configured for one-click deployment on **Vercel**:

- **Production URL**: [https://vitalmonitor.vercel.app](https://vitalmonitor.vercel.app)
- **Configuration**: Root [`vercel.json`](./vercel.json) & [`dashboard/vercel.json`](./dashboard/vercel.json) handle SPA routing rewrites, immutable asset caching, and security headers.
