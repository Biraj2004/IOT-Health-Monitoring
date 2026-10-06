# VITAL / MONITOR — SmartHealth IoT

<p align="center">
  <img src="dashboard/public/favicon.svg" alt="VITAL Logo" width="88" height="88" style="border-radius: 18px;" />
</p>

<p align="center">
  <strong>AI-Enhanced IoT-Based Real-Time Health Monitoring & ECG Anomaly Detection System</strong>
  <br />
  <em>An end-to-end clinical telemetry engineering prototype connecting biomedical sensors to ESP32, FastAPI, MongoDB, and a high-fidelity React 19 dashboard.</em>
</p>

<p align="center">
  <a href="https://vitalmonitor.vercel.app"><img src="https://img.shields.io/badge/Live_Demo-vitalmonitor.vercel.app-008F72?style=flat-square&logo=vercel" alt="Live Demo" /></a>
  <img src="https://img.shields.io/badge/React-19.2-61DAFB?style=flat-square&logo=react&logoColor=black" alt="React 19" />
  <img src="https://img.shields.io/badge/Vite-8.3-646CFF?style=flat-square&logo=vite&logoColor=white" alt="Vite 8" />
  <img src="https://img.shields.io/badge/Python-FastAPI-009688?style=flat-square&logo=fastapi&logoColor=white" alt="FastAPI" />
  <img src="https://img.shields.io/badge/Database-MongoDB_Atlas-47A248?style=flat-square&logo=mongodb&logoColor=white" alt="MongoDB Atlas" />
  <img src="https://img.shields.io/badge/Hardware-ESP32_DevKit-E7352C?style=flat-square&logo=espressif&logoColor=white" alt="ESP32 DevKit" />
  <a href="#11-project-team--contributors"><img src="https://img.shields.io/badge/Contributors-5_Engineers-teal?style=flat-square" alt="Contributors" /></a>
  <a href="./LICENSE"><img src="https://img.shields.io/badge/License-MIT-blue?style=flat-square" alt="MIT License" /></a>
  <a href="./CONTRIBUTING.md"><img src="https://img.shields.io/badge/PRs-Welcome-brightgreen?style=flat-square" alt="PRs Welcome" /></a>
</p>

---

## 1. Executive Summary

**VITAL / MONITOR** (SmartHealth IoT) is a full-stack, hardware-integrated physiological monitoring platform designed as a final-year ECE and software engineering project. 

The system captures vital biometric signals from a patient via non-invasive sensors, digitizes and packages telemetry on an **ESP32 DevKit**, securely streams data over Wi-Fi to a **Python FastAPI** backend for validation, persistence (**MongoDB**), and real-time **WebSocket** broadcast, and renders live medical-grade visualizations on a high-performance **React 19** clinical dashboard.

### Academic & Student Governance
- **Student Team:**
  - Soumyajit Pandit (Roll: `34900323052`) — Lead & Embedded Firmware
  - Debanjan Chakraborty (Roll: `34900323015`) — Backend & ML Systems
  - Bikkram Das (Roll: `34900323012`) — Hardware Systems & Prototyping
  - Biraj Sarkar ([@Biraj2004](https://github.com/Biraj2004), Roll: `34900323013`) — Frontend UI/UX & Real-Time Web
  - Sayan Sarkar ([@Sayan8945](https://github.com/Sayan8945), Roll: `34900323048`) — ML Engineering & Data Analytics
- **Faculty Supervisor:**
  - Prof. Rajib Das, Assistant Professor, Dept. of ECE
- **Laboratory Assistance:**
  - Mr. Abhijit Sarma, Laboratory Assistant, Dept. of ECE
- **Institution:** Cooch Behar Government Engineering College (CGEC), Affiliated to MAKAUT, West Bengal
- **Detailed Profiles & Matrix:** See [Section 11: Project Team & Contributors](#11-project-team--contributors) below for comprehensive technical deliverables and module ownership breakdown.

### Core Monitored Vitals

| Biometric Parameter | Sensor Module | Interface / Pinout | Clinical Unit | Nominal Range |
|:---|:---|:---|:---|:---|
| **ECG Waveform (Lead I)** | **AD8232** | ADC1_CH6 (GPIO 34) | Millivolts (mV) | P-Q-R-S-T wave (0.5 – 2.0 mV) |
| **Heart Rate (Pulse)** | **MAX30102** | I²C (GPIO 21, 22) | BPM | 60 – 100 bpm |
| **Blood Oxygen (SpO₂)** | **MAX30102** | I²C (GPIO 21, 22) | % Saturation | 95% – 100% |
| **Body Temperature** | **DS18B20** | 1-Wire (GPIO 4, 4.7kΩ pull-up) | Celsius (°C) | 36.5°C – 37.5°C |

---

## 2. End-to-End System Architecture

```text
                           PATIENT
                              │
                ┌─────────────┼─────────────┐
                ↓             ↓             ↓
             AD8232       MAX30102       DS18B20
            ECG Lead I    HR + SpO₂     Temperature
                └─────────────┬─────────────┘
                              ↓
                            ESP32
                      Sensor Controller
                              │
                         Wi-Fi / JSON
                              ↓
                      ┌───────────────┐
                      │    FastAPI    │
                      │ Python Backend│
                      └───────┬───────┘
                              │
                ┌─────────────┼─────────────┐
                ↓             ↓             ↓
            Validation      MongoDB       ML Engine
            + Auth          Atlas         (Isolation Forest)
                │             │             │
                │             ↓             ↓
                │        Historical     Trend / Risk
                │           Data         Prediction
                └─────────────┬─────────────┘
                              │
                      WebSocket / REST
                              ↓
                      React Dashboard
                      (VITAL / MONITOR)
                              │
                ┌─────────────┼─────────────┐
                ↓             ↓             ↓
             Live ECG    Vitals Grid    Alarms & Status
           (25 mm/s)     (4 Parameters) (Lead Off / Normal)
```

---

## 3. Hardware Configuration & Circuit Wiring

The hardware acquisition layer is powered by an **ESP32 DevKit** running embedded C/C++ (Arduino framework).

```text
[ MAX30102 PPG ] ──(I²C: SDA=21, SCL=22)──────────┐
[ DS18B20 Temp ] ──(1-Wire: GPIO 4 + 4.7kΩ)───────┼──> [ ESP32 DevKit ] ──(Wi-Fi)──> FastAPI
[ AD8232 ECG   ] ──(Analog: GPIO 34, LO±=32/33)───┘
```

### Complete Pinout Table

| Sensor / Module | Sensor Pin | ESP32 GPIO Pin | Description / Notes |
|:---|:---|:---|:---|
| **MAX30102 (PPG)** | VCC | 3.3V | Regulated 3.3V power |
| | GND | GND | Common ground |
| | SDA | GPIO 21 | I²C Data line (4.7kΩ pull-up) |
| | SCL | GPIO 22 | I²C Clock line (4.7kΩ pull-up) |
| | INT | GPIO 19 | Digital Active-Low Interrupt |
| **DS18B20 (Temp)** | VCC | 3.3V / 5V | Power supply |
| | GND | GND | Common ground |
| | DQ (Data) | GPIO 4 | 1-Wire bus with **4.7kΩ external pull-up** to 3.3V |
| **AD8232 (ECG)** | 3.3V | 3.3V | Clean analog supply |
| | GND | GND | Common ground |
| | OUTPUT | GPIO 34 | ADC1 Channel 6 (analog ECG biopotential) |
| | LO+ | GPIO 32 | Digital Lead-Off positive detect (internal pull-down) |
| | LO- | GPIO 33 | Digital Lead-Off negative detect (internal pull-down) |
| **OLED 0.96"** | SDA / SCL | GPIO 21 / 22 | Shared I²C bus (address `0x3C`) |
| **Status Buzzer** | Positive | GPIO 25 | Active buzzer alarm via NPN driver |
| **SOS Pushbutton** | Signal | GPIO 26 | Manual emergency trigger (internal pull-up) |

---

## 4. Telemetry Protocol & Data Formats

### 4.1. Ingestion Payload (ESP32 → FastAPI)

ECG waveforms require high sample rates (100–250 Hz). The ESP32 buffers raw ADC samples into time-series batches before transmitting over HTTP POST or WebSocket:

```json
{
  "device_id": "ESP32_CLINICAL_01",
  "heart_rate": 74.5,
  "spo2": 98.2,
  "temperature": 36.8,
  "leads_off": false,
  "ecg_samples": [512, 518, 525, 540, 610, 720, 850, 650, 530, 515],
  "timestamp": "2026-10-06T18:30:00.000Z"
}
```

### 4.2. REST & WebSocket Endpoints

| Method | Endpoint | Description |
|:---|:---|:---|
| `POST` | `/api/readings` | Ingest sensor telemetry batch from ESP32 |
| `GET` | `/api/readings/latest` | Retrieve current instantaneous vital signs |
| `GET` | `/api/readings/history` | Query time-series telemetry records from MongoDB |
| `GET` | `/api/predictions/latest` | Retrieve ML anomaly score and physiological trend |
| `WS` | `/ws/health` | Real-time bi-directional WebSocket telemetry stream |

---

## 5. Clinical Web Dashboard (React 19 + Vite)

The frontend interface adheres strictly to the [impeccable.style](https://impeccable.style) design philosophy and the project's [DESIGN-GUIDE.md](./guide/DESIGN-GUIDE.md):

- **Readings Over Decoration**: Elimination of decorative gradients, blurred glassmorphism, emojis, and visual clutter. Pure typography, high-contrast numeric values, and crisp 1px borders.
- **Continuous Lead I Oscilloscope**: High-DPI HTML5 canvas running at 60 FPS on a standardized medical millimeter grid (`25 mm/s` horizontal sweep, `10 mm/mV` vertical gain) with a circular sweep cursor tracking the leading waveform edge.
- **Dual-Mode Telemetry Abstraction**: Real-time WebSocket connection to `ws://localhost:8000/ws/health` with automatic, realistic physiological drift fallback when disconnected.
- **Instant Interactive Controls**: Pause/Resume telemetry, simulate tachycardia (>100 bpm) or hypoxia (<90% SpO₂), reset baseline, and open the architectural workflow modal.
- **Production Performance**: Zero layout shifts (CLS = 0), build footprint < 250 KB gzip, and 100% responsive across Desktop, Tablet, and Mobile viewports.

---

## 6. Project Documentation & Specifications

The repository includes comprehensive architectural, design, academic, and optimization manuals:

| Guide / Document | Location | Purpose |
|:---|:---|:---|
| **AI Agent Governance** | [`AGENTS.md`](./AGENTS.md) | Master AI developer instructions, non-negotiables, hardware pinout, FastAPI schemas, and rules. |
| **IoT Context & Architecture** | [`guide/iot_health_monitoring_ai_agent_project_context.md`](./guide/iot_health_monitoring_ai_agent_project_context.md) | Full technical specification, circuit schematics, ML pipeline, and viva preparation context. |
| **Clinical Design Guide** | [`guide/DESIGN-GUIDE.md`](./guide/DESIGN-GUIDE.md) | Clinical UI tokens, grid standards (25 mm/s · 10 mm/mV), color palettes, and typographic rules. |
| **LaTeX Master Specs** | [`guide/biraj-xelatex-general-specs.md`](./guide/biraj-xelatex-general-specs.md) | XeLaTeX B&W monochrome specifications, dynamic heading hierarchy, tables, and TikZ standards. |
| **SEO & GEO Master Guide** | [`guide/seo-optimization-basic-guide.md`](./guide/seo-optimization-basic-guide.md) | Universal search engine optimization (SEO), Generative Engine Optimization (GEO), and icon-centric branding. |
| **Academic LaTeX Report** | [`report/7th SEM/Workflow_Report.pdf`](./report/7th%20SEM/Workflow_Report.pdf) | Formal 15-page 7th Semester academic engineering workflow report and LaTeX source. |

---

## 7. Quick Start & Local Setup

### Prerequisites

- **Node.js** >= 20.x
- **Python** >= 3.11 (for backend)
- **Arduino IDE / PlatformIO** (for ESP32 firmware)

### 1. Dashboard (Frontend)

```bash
# Navigate to dashboard directory
cd dashboard

# Install dependencies
npm install

# Run local development server
npm run dev
```

The web dashboard will start at `http://localhost:5173/`.

To verify linting and produce a production build:

```bash
npm run lint      # Runs oxlint static analysis (0 warnings, 0 errors)
npm run build     # Compiles production bundle into dist/
npm run preview   # Previews production build locally
```

### 2. Backend (FastAPI Service)

```bash
# Navigate to backend directory (when initialized)
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: .\venv\Scripts\activate

# Install dependencies & run development server
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

---

## 8. Production Deployment & Security

The web dashboard is fully configured for continuous deployment on **Vercel**:

- **Production URL**: [https://vitalmonitor.vercel.app](https://vitalmonitor.vercel.app)
- **Routing & Edge Configuration**: Managed via root [`vercel.json`](./vercel.json) and [`dashboard/vercel.json`](./dashboard/vercel.json).
- **Security Headers Enforced**:
  - `X-Content-Type-Options: nosniff`
  - `X-Frame-Options: DENY`
  - `Referrer-Policy: strict-origin-when-cross-origin`
- **Automated Contributor Deployment Trigger**: Configured via GitHub Actions ([`.github/workflows/auto-commit-dispatch.yml`](.github/workflows/auto-commit-dispatch.yml)). Whenever any contributor pushes code to `main` or `dev`, an automated empty commit is created to signal Vercel's build pipeline and trigger immediate production deployment.
- **CI Validation Pipeline**: Automated pull request and push verification ([`.github/workflows/verify.yml`](.github/workflows/verify.yml)) enforcing static code analysis (`oxlint`) and clean production compilation (`vite build`).

---

## 9. Repository Structure

```text
Health-Monitoring_Final-Year/
├── .github/
│   └── workflows/
│       ├── auto-commit-dispatch.yml # Vercel auto-commit deploy trigger on contributor push
│       └── verify.yml               # Oxlint & Vite production build verification CI
├── .gitignore
├── AGENTS.md                       # Master AI developer instructions & architecture
├── CONTRIBUTING.md                 # Contribution guidelines & PR process
├── LICENSE                         # MIT License
├── README.md                       # Project master documentation
├── vercel.json                     # Vercel deployment & security headers
├── dashboard/                      # React 19 + Vite Frontend Application
│   ├── index.html                  # Semantic HTML, SEO tags, JSON-LD Schema
│   ├── package.json                # React 19, Vite 8, Oxlint
│   ├── vercel.json                 # Dashboard-level Vercel routing
│   ├── public/                     # Static brand assets, PWA icons, sitemap
│   │   ├── favicon.svg             # Scalable medical heart mark
│   │   ├── workflow-report.pdf     # Direct downloadable PDF report
│   │   ├── 404.html                # Single-screen clinical error page
│   │   ├── og-image.png            # 1200×630 icon-centric social preview
│   │   ├── robots.txt              # Bot & AI crawler indexing rules
│   │   ├── sitemap.xml             # XML sitemap
│   │   └── site.webmanifest        # PWA manifest
│   └── src/
│       ├── App.jsx                 # Dashboard container & layout
│       ├── App.css                 # Component styling & responsive rules
│       ├── index.css               # Clinical design tokens (impeccable.style)
│       ├── components/             # ECGMonitor, DashboardHeader, MLAnalysisCard, EventLog, etc.
│       └── hooks/useTelemetry.js   # Dual-mode WebSocket & offline simulation
├── guide/                          # Comprehensive Engineering Specifications
│   ├── DESIGN-GUIDE.md             # Clinical UI/UX design standard
│   ├── biraj-xelatex-general-specs.md # XeLaTeX B&W standards, TikZ, and table rules
│   ├── iot_health_monitoring_ai_agent_project_context.md  # End-to-end architecture & specs
│   └── seo-optimization-basic-guide.md # Universal modern SEO & GEO guide
└── report/                         # Academic Documentation & Thesis
    └── 7th SEM/
        ├── SmartHealth_IoT_Workflow_Report.tex # 15-page XeLaTeX source
        ├── SmartHealth_IoT_Workflow_Report.pdf # Compiled master PDF
        └── Workflow_Report.pdf     # Mirrored submission PDF
```

---

## 10. Medical Disclaimer

> [!IMPORTANT]
> **Academic Engineering Prototype**: This system is designed solely for educational, academic demonstration, and research purposes. It is **not** a certified medical device and must not be used for clinical diagnosis, patient triage, emergency medical response, or therapeutic monitoring in life-critical situations.

---

## 11. Project Team & Contributors

The **VITAL / MONITOR (SmartHealth IoT)** system was conceived, engineered, and delivered as an undergraduate capstone research prototype by a multidisciplinary student team in the **Department of Electronics and Communication Engineering (ECE)** at **Cooch Behar Government Engineering College (CGEC)**, affiliated to **Maulana Abul Kalam Azad University of Technology (MAKAUT), West Bengal**.

### 11.1. Core Engineering Team

| Contributor | University Roll | Core Role | Subsystem Ownership & Key Deliverables | GitHub Profile |
|:---|:---|:---|:---|:---|
| **Soumyajit Pandit** | `34900323052` | **Lead & Embedded Firmware** | • ESP32 dual-core FreeRTOS firmware architecture and tasks<br>• High-resolution ADC timer sampling (AD8232 Lead I at 200 Hz)<br>• MAX30102 I²C FIFO optical buffer parsing and DS18B20 1-Wire driver<br>• Wi-Fi batch payload packaging and circular RAM ring buffer failsafe | — |
| **Debanjan Chakraborty** | `34900323015` | **Backend & ML Systems** | • Python FastAPI asynchronous ingestion microservice (`/api/v1/telemetry/push`)<br>• Real-time bi-directional WebSocket streaming broadcast (`/ws/live`)<br>• Pydantic v2 telemetry validation schemas and auth headers<br>• MongoDB Atlas time-series persistence with compound and 30-day TTL indexes | — |
| **Bikkram Das** | `34900323012` | **Hardware Systems & Prototyping** | • Circuit schematic design, wiring layout, and physical breadboard prototyping<br>• Biomedical signal conditioning and Lead I electrode placement configuration<br>• Passive pull-up/pull-down resistor networks and 3.3V/5V rail isolation<br>• Active piezo buzzer NPN transistor driver and emergency SOS input circuit | — |
| **Biraj Sarkar** | `34900323013` | **Frontend UI/UX & Real-Time Web** | • React 19 clinical web dashboard adhering to `impeccable.style` design tokens<br>• Zero-CLS 60 FPS HTML5 Canvas ECG oscilloscope (25 mm/s · 10 mm/mV grid)<br>• Dual-mode telemetry abstraction (live WebSocket + realistic offline simulation)<br>• Vercel Edge continuous deployment pipeline and comprehensive SEO/GEO suite | [@Biraj2004](https://github.com/Biraj2004) |
| **Sayan Sarkar** | `34900323048` | **ML Engineering & Data Analytics** | • In-memory `scikit-learn` Isolation Forest anomaly scoring model<br>• 4-dimensional physiological feature extraction `[HR, SpO₂, Temp, RR variance]`<br>• Real-time medical telemetry event logging module (`EventLog.jsx`)<br>• Live ML risk scoring and anomaly indicator dashboard card (`MLAnalysisCard.jsx`) | [@Sayan8945](https://github.com/Sayan8945) |

### 11.2. Subsystem Responsibility Matrix

| Subsystem / Layer | Primary Owner | Secondary / Co-Engineer | Core Technologies & Protocols |
|:---|:---|:---|:---|
| **Embedded Firmware & Acquisition** | Soumyajit Pandit | Bikkram Das | ESP32, C/C++, FreeRTOS, ESP-IDF / Arduino, I²C, 1-Wire |
| **Hardware Prototyping & Circuits** | Bikkram Das | Soumyajit Pandit | AD8232, MAX30102, DS18B20, Breadboard / PCB, NPN Transistor |
| **Cloud Backend & Stream Pipeline** | Debanjan Chakraborty | Sayan Sarkar | Python 3.11+, FastAPI, Uvicorn, WebSockets, MongoDB Atlas |
| **Machine Learning & Risk Scoring** | Sayan Sarkar | Debanjan Chakraborty | Scikit-learn, Isolation Forest, NumPy, Feature Engineering |
| **Clinical UI/UX & Web Dashboard** | Biraj Sarkar | Sayan Sarkar | React 19, Vite 8, HTML5 Canvas, Vanilla CSS3, Vercel |
| **Academic Thesis & Master LaTeX** | Biraj Sarkar | Team | XeLaTeX, MiKTeX, TikZ Diagrams, Technical Specifications |

### 11.3. Academic Mentorship & Institutional Guidance

| Role | Mentor / Guide | Academic Designation & Department | Institution |
|:---|:---|:---|:---|
| **Faculty Supervisor** | **Prof. Rajib Das** | Assistant Professor, Department of Electronics & Communication Engineering | Cooch Behar Government Engineering College |
| **Laboratory Technical Guidance** | **Mr. Abhijit Sarma** | Laboratory Assistant, Department of Electronics & Communication Engineering | Cooch Behar Government Engineering College |

### 11.4. Repository Contributors & Git Activity

We extend our sincere thanks to all project contributors who have committed code, hardware designs, and documentation to this repository.

<p align="left">
  <a href="https://github.com/Biraj2004/IOT-Health-Monitoring/graphs/contributors">
    <img src="https://contrib.rocks/image?repo=Biraj2004/IOT-Health-Monitoring" alt="Contributors list" />
  </a>
</p>

- **GitHub Repository**: [Biraj2004/IOT-Health-Monitoring](https://github.com/Biraj2004/IOT-Health-Monitoring)
- **All Project Contributors**: [View Contributor Graph & Commits](https://github.com/Biraj2004/IOT-Health-Monitoring/graphs/contributors)

---

## 12. Contributing Guidelines

We welcome community suggestions, issue reports, hardware testing logs, and code contributions.

- **Issue Tracker**: Report bugs, signal conditioning issues, or feature ideas via GitHub Issues.
- **Pull Requests**: Review our [Contributing Guidelines](CONTRIBUTING.md) for branch naming (`feat/`, `fix/`, `docs/`), commit conventions, and linting procedures before submitting PRs.
- **Code Standard**: Verify `npm run lint` and `npm run build` pass in `dashboard/` with zero warnings before opening a pull request.

---

## 13. License & Acknowledgements

- **License**: This project is open-source software licensed under the [MIT License](LICENSE).
- **Acknowledgements**: Special thanks to the Department of Electronics and Communication Engineering at Cooch Behar Government Engineering College for providing laboratory facilities, instrumentation testbenches, and hardware components.
