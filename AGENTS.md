# AGENTS.md — SmartHealth IoT (VITAL / MONITOR)
> **Master AI Agent Instruction Manual, Architecture Specification, and Operational Governance Guide**  
> *Project:* AI-Enhanced IoT-Based Real-Time Health Monitoring & ECG Anomaly Detection System  
> *Academic Context:* B.Tech Final-Year Capstone Project — Department of Electronics and Communication Engineering (ECE), Cooch Behar Government Engineering College (CGEC), Affiliated to MAKAUT, West Bengal  
> *Live Dashboard:* [vitalmonitor.vercel.app](https://vitalmonitor.vercel.app)  

---

## 1. Project Mission & Core Identity

**SmartHealth IoT** (branded as **VITAL / MONITOR**) is a clinical-grade telemetry engineering platform bridging embedded biomedical instrumentation, asynchronous Python microservices, cloud persistence, and a real-time React web application.

```
┌─────────────────┐       ┌─────────────────┐       ┌─────────────────┐       ┌─────────────────┐
│ Embedded Layer  │  WiFi │  Backend Layer  │  WSS  │ Frontend Layer  │       │ Academic Report │
│ ESP32 + Sensors │ ────> │ FastAPI+MongoDB │ ────> │ React 19 Canvas │       │ XeLaTeX Master  │
│ AD8232/MAX30102 │ JSON  │ In-Memory ML    │ JSON  │ Telemetry UI    │       │ 15-Page B&W Doc │
└─────────────────┘       └─────────────────┘       └─────────────────┘       └─────────────────┘
```

### Academic & Student Governance
- **Student Project Team:**
  - Soumyajit Pandit (Roll: `34900323052`) — Lead & Embedded Firmware
  - Debanjan Chakraborty (Roll: `34900323015`) — Backend & ML Systems
  - Bikkram Das (Roll: `34900323012`) — Hardware Systems & Prototyping
  - Biraj Sarkar (Roll: `34900323013`) — Frontend UI/UX & Real-Time Web
  - Sayan Sarkar (Roll: `34900323048`) — ML Engineering & Data Analytics
- **Faculty Supervisors:**
  - Prof. Rajib Das, Assistant Professor, Dept. of ECE
  - Mr. Abhijit Sarma, Assistant Professor, Dept. of ECE
- **Academic Disclaimer:**
  This project is strictly an undergraduate engineering prototype developed for research, academic evaluation, and viva demonstration. It is **not** a certified medical device and does not hold CE/FDA clinical regulatory approval. All anomaly scores and trend flags are non-diagnostic statistical indices.

---

## 2. Non-Negotiable Architectural Decisions & Constraints

Every AI agent working on this repository MUST strictly abide by these decisions:

1. **Hardware Controller:** Strictly **ESP32 DevKit** (dual-core 240 MHz Tensilica Xtensa, 520 KB SRAM).
2. **Biomedical Sensors:** 
   - ECG: **AD8232** single-lead monitor (Lead I).
   - Pulse & SpO₂: **MAX30102** photoplethysmography (PPG) module.
   - Temperature: **DS18B20** digital thermometer (1-Wire).
3. **Excluded Hardware (DO NOT ADD):**
   - No MPU6050 accelerometer / gyroscope (fall detection is out of scope).
   - No GPS modules (location tracking is out of scope).
   - No additional microcontroller boards or auxiliary cellular shields.
4. **Backend Tech Stack:** Strictly **Python 3.11+ / FastAPI** with Uvicorn and Pydantic v2.
   - **NO Node.js / Express backend.** Node.js is reserved solely for local Vite frontend toolchains.
5. **Database:** Strictly **MongoDB** (MongoDB Atlas for cloud persistence).
6. **Real-Time Distribution:** FastAPI native **WebSockets** (`/ws/live`).
7. **Machine Learning Architecture:**
   - Framework: **Python `scikit-learn`** (Isolation Forest for unsupervised tabular anomaly scoring).
   - Colocated Inference: Run lightweight ML inference **in-memory inside the FastAPI process**.
   - No standalone microservice container or separate ML server.
   - The core IoT data pipeline **MUST function normally even if ML is disabled or uninitialized**.
8. **Frontend Tech Stack:** **React 19**, **Vite**, modern Vanilla CSS (strict design tokens).
   - No heavy component bloat libraries (no Tailwind, no MUI, no Chakra, no Bootstrap).
9. **Zero AI Slop Design Standard:**
   - Strictly NO emojis in production UI.
   - Strictly NO decorative glassmorphism, rainbow gradients, animated glowing blobs, or fake stock charts.
   - Clean, quiet clinical instrument design inspired by medical telemetry monitors (Braun, Philips IntelliVue).

---

## 3. Hardware Interfacing & Embedded Firmware Layer

### Pinout Mapping Table

| Sensor / Subsystem | Physical Pin | ESP32 GPIO Pin | Protocol / Type | Pull-Up / External Circuit |
|:---|:---|:---|:---|:---|
| **AD8232 (ECG Output)** | OUTPUT | **GPIO 34** (ADC1_CH6) | Analog (0 – 3.3V) | None (direct connection) |
| **AD8232 (Leads-Off +)** | LO+ | **GPIO 32** | Digital Input | Internal pull-down |
| **AD8232 (Leads-Off -)** | LO- | **GPIO 33** | Digital Input | Internal pull-down |
| **MAX30102 (PPG)** | SDA | **GPIO 21** | I²C Data | 4.7 kΩ pull-up to 3.3V |
| **MAX30102 (PPG)** | SCL | **GPIO 22** | I²C Clock | 4.7 kΩ pull-up to 3.3V |
| **MAX30102 (Interrupt)** | INT | **GPIO 19** | Digital Active-Low | Pull-up to 3.3V |
| **DS18B20 (Temperature)** | DQ | **GPIO 4** | 1-Wire Digital | **4.7 kΩ external resistor to 3.3V** |
| **OLED Display (0.96")** | SDA / SCL | **GPIO 21 / 22** | I²C Bus (0x3C) | Shared I²C bus |
| **Status Buzzer** | Positive | **GPIO 25** | PWM / GPIO | NPN transistor driver / direct |
| **Manual SOS Pushbutton** | Pin 1 | **GPIO 26** | Digital Input | Internal pull-up to 3.3V |

### Cyclic Sampling & Batching Protocol
To preserve ESP32 Wi-Fi stack throughput and eliminate HTTP connection overhead:
- **Sampling Rates:**
  - AD8232 ECG: **200 Hz** (sampled every 5 ms via high-resolution hardware timer interrupt or FreeRTOS task).
  - MAX30102 PPG: **50 Hz** raw optical FIFO sampling; heart rate & SpO₂ computed at **1 Hz**.
  - DS18B20 Temp: **0.5 Hz** (polled every 2 seconds).
- **Batching Strategy:**
  - ECG samples are collected into an in-memory buffer of **50 integer points** (250 ms duration).
  - The ESP32 dispatches **4 HTTP POST payloads per second** to the backend endpoint `/api/v1/telemetry/push`.
- **Payload Schema (ESP32 -> FastAPI):**
```json
{
  "device_id": "ESP32_HEALTH_01",
  "auth_token": "bearer_secret_token",
  "timestamp": 1728229860.125,
  "vitals": {
    "heart_rate": 74.5,
    "spo2": 98.2,
    "temperature": 36.8,
    "ecg_lead_off": false
  },
  "ecg_batch": [512, 520, 535, 610, 780, 920, 680, 530, 515, ...]
}
```
- **Failsafe Resiliency:** ESP32 firmware includes a 10-second circular ring buffer in RAM to absorb temporary Wi-Fi dropouts without dropping vitals.

---

## 4. Backend & Database Architecture (FastAPI & MongoDB)

### API Endpoints Specification

| Method | Route | Authentication | Payload / Parameters | Purpose |
|:---|:---|:---|:---|:---|
| `POST` | `/api/v1/telemetry/push` | Header `X-Device-Token` | Telemetry JSON payload | Sensor batch ingest from ESP32 |
| `GET` | `/api/v1/telemetry/latest` | Optional API Key | None | Returns most recent patient vitals |
| `GET` | `/api/v1/telemetry/history` | Optional API Key | `?hours=24&limit=500` | Historical vitals for trend charts |
| `GET` | `/api/v1/health` | Public | None | Microservice health check & uptime |
| `WS` | `/ws/live` | Query token | WebSocket bidirectional | Real-time broadcast to React frontend |

### In-Memory ML Anomaly Scorer
- Model: `sklearn.ensemble.IsolationForest(contamination=0.03, random_state=42)`
- Features analyzed per cycle:
  `[ heart_rate, spo2, temperature, ecg_rr_variance ]`
- Output broadcasted over WebSocket:
```json
{
  "anomaly": false,
  "anomaly_score": -0.12,
  "trend_risk": "nominal"
}
```
- **Defensive Invariant:** If `anomaly_model.pkl` is missing or fails inference, the backend falls back to rule-based bounding box checks without interrupting WebSocket distribution.

### MongoDB Document Schema (`vitals_records`)
```javascript
{
  "_id": ObjectId("..."),
  "device_id": "ESP32_HEALTH_01",
  "timestamp": ISODate("2026-10-06T20:58:30.000Z"),
  "heart_rate": 74.0,
  "spo2": 98.0,
  "temperature": 36.8,
  "ecg_lead_off": false,
  "ecg_chunk": [512, 518, 525, 610, ...], // 50 raw samples
  "anomaly_detected": false,
  "anomaly_score": 0.04
}
```
*Index Strategy:* Compound index on `{ device_id: 1, timestamp: -1 }` with a 30-day TTL index on `timestamp`.

---

## 5. Frontend Dashboard Standards (VITAL / MONITOR)

### Visual Philosophy & Design System (from `DESIGN-GUIDE.md`)
- **Tone:** Quiet, clinical, authoritative instrument. Restrained teal for healthy connection (`#008F72`), medical red for ECG sweep trace (`#E52B2B`), danger alert (`#B42318`), warning amber (`#A86400`).
- **Surface Palette:** Background canvas `#F3F5F6`, clean white card panels `#FFFFFF`, subtle 1px border `#D8DEE5`, text primary `#172235`, secondary `#586579`, muted labels `#778294`.
- **Typography:** Inter for clean sans labels; JetBrains Mono / tabular numbers (`font-variant-numeric: tabular-nums`) for high-contrast numeric values.

### Responsive Layout & Viewport Rules
- **Breakpoints:**
  - Desktop: `> 1024px` (Full 3-column vitals, 2.7:1 ECG to Sensor grid, persistent top bar).
  - Tablet: `768px – 1023px` (2-column vitals, stacked ECG and Sensor cards).
  - Mobile: `≤ 767px` (Single column vitals, stacked cards, fluid canvas).
  - Extra-Small Mobile: `≤ 380px` (Tightened 10px page gutters, 34px vital figures, 170px canvas).
- **Header Rules:**
  - Left: Brand `VITAL / MONITOR`.
  - Right: `Workflow report` button + Divider + `DEVICE CONNECTED` status badge + `Last update` timestamp.
  - **Mobile Rule:** The `Workflow report` button and its divider are strictly hidden (`display: none`) on mobile (`≤ 767px`). The header remains a clean 2-row block without horizontal scroll.
- **Horizontal Scroll Prohibition:**
  - `overflow-x: hidden` / `overflow-x: clip` enforced globally on `html, body`.
  - All flex/grid containers and children must use `min-width: 0` to allow shrinking.
  - ECG Canvas must use fluid `style.width = '100%'` with CSS breakpoint-driven heights (never hard-coded pixel widths).

### High-Performance ECG Canvas Engine
- Implemented in `dashboard/src/components/ECGMonitor.jsx`.
- Features:
  - 25 mm/s simulated medical sweep velocity.
  - Standard medical background grid: 1 mm minor lines (`#F0E6E6`) and 5 mm major lines (`#E6D4D4`).
  - Darker medical trace (`#E52B2B`, 1.75px line width) with an active glowing sweep head.
  - Sweep-erase bar algorithm: Previous waveform ahead of the sweep head is progressively cleared over a 24-pixel gap.
  - Zero-garbage-collection rendering loop utilizing `requestAnimationFrame`.

---

## 6. XeLaTeX Documentation & Final-Year Report Standards

The complete B.Tech project report is maintained in LaTeX at:  
`report/7th SEM/SmartHealth_IoT_Workflow_Report.tex`

### Document Specifications
- **Compiler:** XeLaTeX (MiKTeX at `C:\Users\biraj\AppData\Local\Programs\MiKTeX\miktex\bin\x64\xelatex.exe`).
- **Page Budget:** **Exactly 15 pages** (comprehensive workflow and viva dossier).
- **Typography:** Body `12pt` Calibri (`\setmainfont{Calibri}`), line spacing `1.18`, unindented paragraphs with `4pt` skip.
- **Color Theme:** Strict Black & White / Grayscale Master Specification (`biraj-xelatex-general-specs.md`).
- **Cover Page Structure:**
  - Outer squircle margin border: `1.2pt` black line with `18pt` rounded corners, inset `0.45in` from the paper boundary.
  - Student project team listing: Clean names and roll numbers only (no trailing role designations).
  - Balanced vertical distribution using `\vfill` across institution header, title box, dossier table, and disclaimer.
- **Table of Contents (TOC):**
  - Dedicated full page (Page 2).
  - `18pt` vertical gap between `\contentsname` and the first TOC entry.
  - Hyperlinks: `linktoc=all` (both section title and page number clickable).
  - Valid anchors (`\phantomsection` on unnumbered sections like Executive Summary).

### Compilation & Synchronization Workflow
Whenever editing the `.tex` source, execute the full compilation pass:
```powershell
$x = "C:\Users\biraj\AppData\Local\Programs\MiKTeX\miktex\bin\x64\xelatex.exe"
1..3 | % { & $x -interaction=nonstopmode SmartHealth_IoT_Workflow_Report.tex | Out-Null }
Copy-Item SmartHealth_IoT_Workflow_Report.pdf Workflow_Report.pdf -Force
Copy-Item SmartHealth_IoT_Workflow_Report.pdf ..\..\dashboard\public\workflow-report.pdf -Force
Copy-Item SmartHealth_IoT_Workflow_Report.pdf ..\..\dashboard\public\SmartHealth_IoT_Workflow_Report.pdf -Force
Remove-Item *.aux, *.log, *.out, *.toc -ErrorAction SilentlyContinue
```

---

## 7. Repository Directory Structure

```
Health-Monitoring_Final-Year/
├── AGENTS.md                  # This file (Master AI developer context & instructions)
├── README.md                  # Project overview, badges, hardware schematics & setup
├── CONTRIBUTING.md            # Git branch rules, commit conventions, contribution flow
├── LICENSE                    # MIT License
├── vercel.json                # Vercel deployment routes and SPA rewrites
│
├── dashboard/                 # React 19 + Vite Web Application
│   ├── index.html             # HTML5 entry with clinical metadata & fonts
│   ├── package.json           # Dependencies (React 19, Lucide icons, Vite)
│   ├── vite.config.js         # Vite configuration with build optimizations
│   ├── public/
│   │   ├── favicon.svg        # Medical telemetry vector icon
│   │   ├── 404.html           # Standalone single-screen 404 error page
│   │   └── workflow-report.pdf# Compiled PDF report served directly to users
│   └── src/
│       ├── main.jsx           # React DOM root render
│       ├── App.jsx            # Top-level state coordinator & mock fallback
│       ├── App.css            # Component styles & responsive queries
│       ├── index.css          # Design system tokens, modern CSS reset
│       ├── components/
│       │   ├── DashboardHeader.jsx  # Brand, report link, connection & time status
│       │   ├── ECGMonitor.jsx       # 25 mm/s HTML5 Canvas medical waveform engine
│       │   ├── ErrorBoundary.jsx    # React crash handler
│       │   ├── ErrorPage.jsx        # Clinical 404/500 zero-scroll screen
│       │   └── Icons.jsx            # Lightweight SVG icon bundle
│       └── hooks/
│           └── useTelemetry.js      # WebSocket client with auto-reconnection
│
├── guide/                     # Technical specifications & design rules
│   ├── DESIGN-GUIDE.md        # Complete visual design & UX system
│   ├── biraj-xelatex-general-specs.md # LaTeX formatting, fonts, TikZ & table rules
│   ├── iot_health_monitoring_ai_agent_project_context.md # End-to-end architecture brief
│   └── seo-optimization-basic-guide.md # Meta tags, robots.txt, schema standards
│
└── report/
    └── 7th SEM/               # Academic Project Documentation
        ├── SmartHealth_IoT_Workflow_Report.tex  # XeLaTeX master document (15 pages)
        ├── SmartHealth_IoT_Workflow_Report.pdf  # Compiled master PDF
        ├── Workflow_Report.pdf                  # Mirrored submission PDF
        └── images/            # Schematics and circuit diagrams
```

---

## 8. Development & Verification Commands

### Frontend Dashboard (Vite)
- **Install dependencies:** `npm install` (in `dashboard/`)
- **Start local dev server:** `npm run dev` (runs on `http://localhost:5173`)
- **Validate production build:** `npm run build` (outputs to `dashboard/dist/`)
- **Lint code:** `npm run lint`

### LaTeX Document Compilation
- **XeLaTeX Executable:** `C:\Users\biraj\AppData\Local\Programs\MiKTeX\miktex\bin\x64\xelatex.exe`
- **Clean build command:** Always perform multi-pass compilation for TikZ overlays and hyperlinks, then clean auxiliary files (`.aux`, `.log`, `.toc`, `.out`).

---

## 9. AI Agent Pair-Programming Principles

1. **Evidence Before Assertion:**
   Always verify code changes with execution tests, builds, or visual inspection scripts before asserting completion.
2. **Preserve Documentation Integrity:**
   Never strip comments, existing docstrings, or academic attribution metadata unless explicitly directed.
3. **Responsive-First CSS:**
   When styling frontend elements, always account for desktop (`1280px`), tablet (`768px`), mobile (`360px`), and extra-small (`320px`) screens. Never allow horizontal scrollbars.
4. **Safety & Medical Ethics:**
   Maintain conservative medical disclaimers in all UI strings and reports. Never characterize unvalidated sensor readings as diagnostic facts.
5. **Clean Git Hygiene:**
   Produce modular, well-explained git diffs adhering to conventional commit specifications (`feat:`, `fix:`, `docs:`, `refactor:`, `style:`).
