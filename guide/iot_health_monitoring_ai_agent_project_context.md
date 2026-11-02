# IoT-Based Health Monitoring System — Complete Project Specification & Chat Context

## 1. Project Overview

The project is an **IoT-based real-time health monitoring system** designed as an ECE + software/full-stack project.

The system collects physiological data from sensors connected to an **ESP32**, sends the data over Wi-Fi to a **Python FastAPI backend**, stores historical readings in **MongoDB**, performs optional **AI/ML trend/anomaly prediction**, and displays live and historical information in a **React dashboard**.

### Final monitoring scope

The selected core health parameters are:

- ECG waveform
- SpO₂
- Heart rate
- Temperature

The project does **not** require:

- MPU6050 / fall detection
- GPS
- AI chatbot
- Multiple ML servers
- Node.js backend

AI/ML is an optional advanced layer on top of the working IoT system.

---

# 2. Project Goal

Build a complete end-to-end system:

```text
Patient
   ↓
Sensors
   ↓
ESP32
   ↓ Wi-Fi
FastAPI Backend
   ↓
MongoDB
   ↓
ML Analysis (optional)
   ↓
React Dashboard
```

The project should demonstrate:

- Embedded systems
- Sensors
- ESP32 programming
- IoT communication
- REST APIs
- WebSockets
- Database design
- Real-time visualization
- Python backend development
- Machine learning
- Full-stack development

---

# 3. Final Hardware & Bill of Materials (BOM)

## Required Components (Updated Hardware Setup)

| # | Component | Quantity | Purpose & Circuit Role |
|:---:|:---|:---:|:---|
| 1 | **ESP32 DevKit V1 (30/38-pin)** | 1 | Central dual-core microcontroller + 2.4 GHz Wi-Fi bridge; executes 100 Hz ADC sampling, I2C/1-Wire acquisition, local OLED & buzzer alerts, and 50-sample telemetry batch dispatch. |
| 2 | **AD8232 ECG Module with Lead Cable** | 1 | Single-lead ECG analog front-end biopotential amplifier & filter; outputs continuous 0–3.3V analog waveform to GPIO34 (ADC1_CH6). |
| 3 | **Disposable ECG Electrode Pads** | 1 pack | Ag/AgCl conductive snap-on dermal electrode interface (RA, LA, RL Einthoven Lead-I configuration). |
| 4 | **MAX30102 SpO₂ and PPG Module** | 1 | Integrated optical pulse oximeter & heart-rate biosensor; measures red/IR light absorption over shared I2C bus (Address: 0x57, SDA: GPIO21, SCL: GPIO22). |
| 5 | **Waterproof DS18B20 Temperature Probe** | 1 | Precision digital body surface temperature sensor operating over Dallas 1-Wire protocol on GPIO18 with ±0.5°C accuracy. |
| 6 | **0.96-inch I²C OLED Display (SSD1306)** | 1 | Local visual output for real-time vital metrics (HR, SpO₂, Temp) and network diagnostics; multiplexed on shared I2C bus (Address: 0x3C, SDA: GPIO21, SCL: GPIO22). |
| 7 | **Active Piezo Buzzer** | 1 | Edge-level acoustic emergency alarm driven via active HIGH logic on GPIO25 for immediate threshold alerts (e.g., SpO₂ < 90%). |
| 8 | **SOS Push Button** | 1 | Tactile edge-level manual emergency SOS trigger / screen toggle wired between GPIO14 and GND with internal pull-up enabled. |
| 9 | **4.7 kΩ Resistors** | 2 | 1 mandatory pull-up resistor bridged between DS18B20 DATA line and 3.3V rail; 1 spare / optional I2C pull-up termination. |
| 10 | **Jumper Wire Set** | 1 set | Initial signal interconnects, diagnostics, and breadboard prototyping before permanent mounting. |
| 11 | **Normal Connecting Wire (for Soldering)** | — | Solid-core and insulated flexible hookup wire for permanent point-to-point soldering on prototype board. |
| 12 | **Perfboard / Prototype PCB / Veroboard** | 1 (large) | Non-connecting pad-per-hole rigid carrier board hosting modular female sockets, noise-isolated ground planes, and all soldered sensor connections. |
| 13 | **3.7V Li-ion Batteries** | 2 | 2S Series configuration providing 7.4V nominal (8.4V peak) isolated DC power; completely eliminates 50 Hz AC mains ground loop hum. |
| 14 | **DC-DC Step-Down Buck Converter** | 1 | High-efficiency switching regulator stepping down 7.4V–8.4V battery pack down to stable 5.0V DC fed into ESP32 VIN (onboard LDO then delivers clean 3.3V to sensors). |

### Power Architecture: 2S Li-ion + Buck Regulation
* **Battery Configuration:** 2x 3.7V Li-ion cells in **Series (2S)** yielding 7.4V nominal (8.4V fully charged).
* **Buck Converter Step-Down:** Drops $7.4\text{V} - 8.4\text{V} \rightarrow 5.0\text{V}$ DC with $>90\%$ electrical efficiency.
* **Two-Stage Noise Rejection:** The regulated 5.0V feeds into the ESP32 `VIN` pin. The ESP32's onboard linear LDO (AMS1117/ME6211) further steps this down to an ultra-clean **3.3V** rail, using its high Power Supply Rejection Ratio (PSRR) to filter out high-frequency buck switching ripple before power reaches the sensitive AD8232 analog front-end.

## Not required

- MPU6050 / Fall detection
- GPS module
- Additional fall-detection hardware
- Separate ECG hardware beyond AD8232
- Node.js backend
- Separate ML server

---

# 4. Sensor Responsibilities

## AD8232 — ECG

AD8232 provides an ECG electrical signal as continuously changing numerical samples.

Example:

```text
512
518
525
540
610
720
850
650
530
515
...
```

The system uses these samples to create a real-time ECG waveform.

Important distinction:

- AD8232 provides the ECG signal.
- It does not directly provide a diagnosis.
- ECG processing/analysis is performed by software.

---

## MAX30102 — SpO₂ + Heart Rate

Example values:

```text
Heart Rate = 76 BPM
SpO₂ = 98%
```

The MAX30102 is responsible for:

- Heart rate
- Blood oxygen saturation

---

## DS18B20 — Temperature

Example:

```text
Temperature = 36.7 °C
```

---

# 5. What ESP32 Sends to Software

ESP32 collects sensor data and sends JSON over Wi-Fi.

Example:

```json
{
  "device_id": "ESP32_001",
  "heart_rate": 76,
  "spo2": 98,
  "temperature": 36.7,
  "ecg_samples": [
    512,
    518,
    525,
    540,
    610,
    720,
    850,
    650
  ]
}
```

ECG is a time-series stream, so it should normally be sent in batches rather than sending one HTTP request per individual ECG sample.

---

# 6. Complete Architecture

```text
                     PATIENT
                        │
          ┌─────────────┼─────────────┐
          ↓             ↓             ↓
       AD8232       MAX30102       DS18B20
         ECG         HR + SpO₂     Temperature
          └─────────────┬─────────────┘
                        ↓
                      ESP32
                Sensor Controller
                        │
                      Wi-Fi
                        ↓
                ┌───────────────┐
                │    FastAPI    │
                │ Python Backend│
                └───────┬───────┘
                        │
          ┌─────────────┼─────────────┐
          ↓             ↓             ↓
      Validation      MongoDB       ML Model
      + Auth          Atlas         Inference
          │             │             │
          │             ↓             ↓
          │        Historical      Prediction
          │           Data             │
          └─────────────┬──────────────┘
                        ↓
                  WebSocket / REST
                        ↓
                React Dashboard
                        │
          ┌─────────────┼─────────────┐
          ↓             ↓             ↓
       Live ECG      Vital Cards    ML Results
```

---

# 7. Backend — FastAPI Only

The project uses **Python + FastAPI** as the backend.

Node.js/Express is NOT required.

FastAPI responsibilities:

1. Receive ESP32 data
2. Validate incoming sensor data
3. Authenticate devices
4. Store readings
5. Run alert checks
6. Run ML inference
7. Provide REST APIs
8. Provide WebSocket communication
9. Send real-time updates to React

---

# 8. API Design

Recommended endpoints:

```text
POST   /api/readings
GET    /api/readings/latest
GET    /api/readings/history
GET    /api/patients/{id}
POST   /api/devices/register
GET    /api/predictions/latest
WS     /ws/health
```

## POST /api/readings

ESP32 sends sensor readings.

Example:

```json
{
  "device_id": "ESP32_001",
  "heart_rate": 76,
  "spo2": 98,
  "temperature": 36.7,
  "ecg_samples": [512, 518, 525, 540]
}
```

FastAPI:

```python
from fastapi import FastAPI

app = FastAPI()

@app.post("/api/readings")
async def receive_reading(data: HealthReading):
    # Validate
    # Store
    # ML inference
    # Broadcast
    return {"status": "success"}
```

---

# 9. Pydantic Schema

Example:

```python
from pydantic import BaseModel
from typing import List

class HealthReading(BaseModel):
    device_id: str
    heart_rate: float
    spo2: float
    temperature: float
    ecg_samples: List[int]
```

FastAPI automatically validates incoming JSON.

---

# 10. MongoDB

MongoDB stores historical health data.

Example document:

```json
{
  "device_id": "ESP32_001",
  "heart_rate": 76,
  "spo2": 98,
  "temperature": 36.7,
  "ecg_samples": [512, 518, 525, 540],
  "timestamp": "2026-08-30T16:30:00Z"
}
```

Recommended deployment:

```text
FastAPI
   ↓
MongoDB Atlas
```

MongoDB credentials must be stored in environment variables, not committed to Git.

---

# 11. Real-Time ECG

The ECG waveform needs real-time delivery.

Use FastAPI WebSockets:

```text
ESP32
  ↓
FastAPI
  ↓
WebSocket
  ↓
React
  ↓
ECG chart
```

Development:

```text
ws://localhost:8000/ws/health
```

Production:

```text
wss://health-api.example.com/ws/health
```

React receives ECG samples and continuously updates the chart.

---

# 12. React Dashboard

Suggested dashboard:

```text
┌──────────────────────────────────────────┐
│       IOT HEALTH MONITORING              │
├──────────────────────────────────────────┤
│                                          │
│ ❤️ Heart Rate        🩸 SpO₂             │
│    76 BPM              98 %              │
│                                          │
│ 🌡 Temperature                            │
│    36.7 °C                               │
│                                          │
├──────────────────────────────────────────┤
│              ECG WAVEFORM                │
│                                          │
│       /\          /\       /\            │
│      /  \        /  \     /  \           │
│ ____/    \______/    \___/    \___       │
│                                          │
├──────────────────────────────────────────┤
│ ML ANALYSIS                              │
│ Status: Normal                           │
│ Anomaly Score: 0.12                      │
└──────────────────────────────────────────┘
```

Frontend technology:

- React
- Tailwind CSS
- Recharts or Chart.js
- REST API
- WebSocket

---

# 13. Alerts

FastAPI can implement configurable threshold-based alerts.

Example project rules:

```python
if spo2 < SPO2_THRESHOLD:
    alert = "Low SpO2 detected"

if heart_rate > HEART_RATE_HIGH_THRESHOLD:
    alert = "High heart-rate reading detected"

if temperature > TEMPERATURE_HIGH_THRESHOLD:
    alert = "High temperature reading detected"
```

These are **prototype alert rules**, not medical diagnostic rules.

Possible alert mechanisms:

- Dashboard alert
- Buzzer
- Email
- Optional SMS

---

# 14. AI/ML Feature

AI/ML is optional.

The recommended ML feature is:

## Health Trend + Anomaly Prediction

Instead of only checking fixed thresholds, the system analyzes historical data.

Input:

```text
ECG-derived features
Heart rate
SpO₂
Temperature
Historical trends
```

Then:

```text
Historical Data
      ↓
Feature Engineering
      ↓
ML Model
      ↓
Anomaly / Trend Prediction
      ↓
React Dashboard
```

---

# 15. Future Prediction

The project can include future trend prediction.

Example historical data:

```text
Time       HR    SpO₂    Temp
10:00      72     98     36.6
10:05      76     98     36.7
10:10      82     97     36.8
10:15      89     96     37.0
10:20      96     95     37.1
```

ML could identify:

```text
Predicted trend:

Heart Rate → increasing
SpO₂ → decreasing trend
Temperature → slight increase

Predicted risk/trend → elevated
```

The system should describe this as **trend/risk prediction**, not as a medical diagnosis.

---

# 16. Recommended ML Features

## Feature 1 — Anomaly Detection

Use historical patterns to detect unusual combinations.

Example:

```text
Typical:
HR   = 65–80
SpO₂ = 96–99
Temp = 36.5–37.2

Current:
HR   = 105
SpO₂ = 93
Temp = 37.6

ML:
Unusual pattern detected
```

Possible first model:

- Isolation Forest

---

## Feature 2 — Heart Rate Trend Prediction

Input:

```text
70 → 73 → 76 → 81 → 85
```

Prediction:

```text
Next trend → increasing
```

Possible models:

- Linear Regression
- Random Forest
- Gradient Boosting
- LSTM/GRU for advanced implementation

---

## Feature 3 — ECG Classification

Advanced option:

```text
ECG samples
   ↓
Signal preprocessing
   ↓
Feature extraction / deep learning
   ↓
ECG segment classification
```

Possible outputs could be:

- Normal-like pattern
- Possible abnormal rhythm pattern
- Other classification categories depending on the dataset

This should be presented as an **educational/research classifier**, not a diagnostic system.

---

# 17. ML Technology Stack

Since FastAPI is Python:

```text
Python
├── NumPy       → numerical processing
├── Pandas      → data processing
├── SciPy       → ECG/signal processing
├── Scikit-learn → ML
└── TensorFlow/PyTorch → optional deep learning
```

Start with scikit-learn.

Do not add deep learning unless the basic system is already working.

---

# 18. ML Server Architecture

A separate ML server is NOT required.

Use:

```text
ESP32
 ↓
FastAPI
 ↓
ML model
 ↓
Prediction
 ↓
React
```

Training and inference are separate processes conceptually:

```text
TRAINING:

Dataset
 ↓
train.py
 ↓
model.pkl


INFERENCE:

ESP32
 ↓
FastAPI
 ↓
model.pkl
 ↓
Prediction
```

The trained model can be loaded by FastAPI.

---

# 19. Recommended File Structure

```text
iot-health-monitoring/
│
├── README.md
├── .gitignore
├── docker-compose.yml
│
├── hardware/
│   ├── esp32/
│   │   ├── main.ino
│   │   ├── config.h
│   │   ├── sensors/
│   │   │   ├── ad8232_ecg.cpp
│   │   │   ├── ad8232_ecg.h
│   │   │   ├── max30102.cpp
│   │   │   ├── max30102.h
│   │   │   ├── ds18b20.cpp
│   │   │   └── ds18b20.h
│   │   ├── wifi/
│   │   │   ├── wifi_manager.cpp
│   │   │   └── wifi_manager.h
│   │   └── communication/
│   │       ├── api_client.cpp
│   │       └── api_client.h
│   │
│   └── circuit/
│       ├── circuit_diagram.png
│       └── pin_configuration.md
│
├── backend/
│   ├── requirements.txt
│   ├── .env.example
│   └── app/
│       ├── main.py
│       ├── api/
│       │   ├── readings.py
│       │   ├── devices.py
│       │   └── predictions.py
│       ├── schemas/
│       │   ├── health_reading.py
│       │   ├── device.py
│       │   └── prediction.py
│       ├── models/
│       │   ├── health_reading.py
│       │   └── device.py
│       ├── database/
│       │   ├── connection.py
│       │   └── collections.py
│       ├── services/
│       │   ├── reading_service.py
│       │   ├── alert_service.py
│       │   └── prediction_service.py
│       ├── websocket/
│       │   └── manager.py
│       └── core/
│           ├── config.py
│           └── security.py
│
├── ml/
│   ├── data/
│   │   ├── raw/
│   │   └── processed/
│   ├── notebooks/
│   │   └── exploration.ipynb
│   ├── preprocessing/
│   │   ├── clean.py
│   │   └── features.py
│   ├── models/
│   │   ├── anomaly_detection.py
│   │   └── trend_prediction.py
│   ├── train.py
│   ├── evaluate.py
│   └── saved/
│       └── model.pkl
│
├── frontend/
│   ├── package.json
│   └── src/
│       ├── components/
│       │   ├── ECGChart.jsx
│       │   ├── HeartRateCard.jsx
│       │   ├── SpO2Card.jsx
│       │   ├── TemperatureCard.jsx
│       │   └── PredictionCard.jsx
│       ├── pages/
│       │   ├── Dashboard.jsx
│       │   └── History.jsx
│       ├── services/
│       │   ├── api.js
│       │   └── websocket.js
│       └── App.jsx
│
└── docs/
    ├── architecture.png
    ├── api_documentation.md
    ├── database_schema.md
    └── project_report.md
```

---

# 20. Deployment Architecture

Recommended:

```text
ESP32
  │
  │ HTTPS
  ↓
FastAPI Server
  │
  ├── MongoDB Atlas
  │
  ├── ML Model
  │
  └── WebSocket
        │
        ↓
React Frontend
```

Suggested deployment options:

- FastAPI → Render / Railway / VPS
- React → Vercel / similar frontend host
- Database → MongoDB Atlas
- ML → Same FastAPI server initially

No separate ML server is required.

---

# 21. Local Development

During development:

```text
Wi-Fi Router / Laptop Hotspot
       │
       ├── ESP32
       │
       └── Laptop
             │
             ├── FastAPI :8000
             ├── MongoDB
             └── React :5173
```

ESP32 sends:

```text
http://LAPTOP_LOCAL_IP:8000/api/readings
```

Production uses:

```text
https://your-fastapi-domain/api/readings
```

WebSocket:

```text
ws://localhost:8000/ws/health
```

Production:

```text
wss://your-fastapi-domain/ws/health
```

---

# 22. Deployment Sequence

Recommended development order:

### Phase 1 — Hardware

Test:

```text
AD8232 → ESP32
MAX30102 → ESP32
DS18B20 → ESP32
```

Use Serial Monitor.

### Phase 2 — FastAPI

Create:

```text
POST /api/readings
```

Test using Postman/curl.

### Phase 3 — Wi-Fi

Connect:

```text
ESP32 → Wi-Fi → FastAPI
```

### Phase 4 — MongoDB

Implement:

```text
FastAPI → MongoDB
```

### Phase 5 — React

Implement:

```text
React → FastAPI
```

### Phase 6 — WebSocket

Implement:

```text
FastAPI WebSocket → React
```

### Phase 7 — ECG visualization

Display live ECG waveform.

### Phase 8 — Alerts

Add configurable alert rules.

### Phase 9 — ML

Train and validate the ML model.

### Phase 10 — Deployment

Deploy:

```text
MongoDB → Atlas
FastAPI → Cloud
React → Vercel
ESP32 → Production API
```

---

# 23. Complete Technology Stack

## Hardware

```text
ESP32 DevKit V1 (30/38-pin)
AD8232 ECG Module + 3-Lead Cable + Ag/AgCl Electrodes
MAX30102 PPG & Pulse Oximeter Module
DS18B20 Waterproof Temperature Probe + 4.7kΩ Pull-up Resistor
0.96" I2C OLED (SSD1306 128x64)
Active Piezo Buzzer (GPIO25)
SOS Tactile Push Button (GPIO14)
2x 3.7V Li-ion Batteries (2S Series: 7.4V - 8.4V)
DC-DC Step-Down Buck Converter (Tuned to 5.0V)
Large Non-Connecting Perfboard / Prototype PCB + Soldering Wires
```

## Embedded

```text
C/C++
Arduino IDE
```

## Communication

```text
Wi-Fi
HTTP/HTTPS
WebSocket/WSS
JSON
```

## Backend

```text
Python
FastAPI
Pydantic
Uvicorn
```

## Database

```text
MongoDB
MongoDB Atlas
```

## Frontend

```text
React
Tailwind CSS
Recharts / Chart.js
```

## ML

```text
Python
NumPy
Pandas
SciPy
Scikit-learn
Optional TensorFlow/PyTorch
```

---

# 24. Project Development Philosophy

Do NOT start by implementing AI.

Recommended order:

```text
Hardware
   ↓
Sensor readings
   ↓
ESP32
   ↓
FastAPI
   ↓
MongoDB
   ↓
React
   ↓
WebSocket
   ↓
Live ECG
   ↓
Alerts
   ↓
ML
```

The base IoT system must work before ML is added.

AI should improve the project, not be used merely as a label.

---

# 25. Medical Safety / Project Scope

This is an **academic/engineering prototype**, not a medical device.

Do not claim that the project:

- Diagnoses disease
- Replaces a doctor
- Predicts heart attacks
- Guarantees medical outcomes

ML outputs should be described as:

- Trend
- Anomaly
- Risk indicator
- Experimental classification

not definitive medical diagnoses.

---

# 26. Original Project Discussion Summary

The project started from the idea of an **IoT Health Monitoring System** for an ECE student.

The hardware/software direction evolved as follows:

1. Initially considered a broader health-monitoring system.
2. Identified ESP32 as the main IoT controller because it includes Wi-Fi.
3. Selected MAX30102 for SpO₂ and heart-rate measurement.
4. Selected DS18B20 for temperature.
5. Added AD8232 specifically for ECG waveform acquisition.
6. Considered MPU6050 for fall detection but decided it is not necessary.
7. Considered GPS but decided it is not necessary.
8. Established that ECG data consists of numerical samples rather than an image.
9. Established that ESP32 sends sensor data to software over Wi-Fi.
10. Selected FastAPI as the only backend instead of Node.js/Express.
11. Selected MongoDB for historical data.
12. Selected React for the frontend.
13. Selected WebSockets for real-time ECG/dashboard updates.
14. Determined that AI/ML is optional but can add meaningful functionality.
15. Chosen ML direction: anomaly detection and future trend/risk prediction.
16. Determined that ML does not require a separate server.
17. ML training can occur separately, while inference runs inside FastAPI.
18. Created a professional modular project structure separating hardware, backend, ML, frontend, and documentation.
19. Planned deployment using FastAPI + MongoDB Atlas + React hosting.
20. The final project concept is an **AI-enhanced IoT-based real-time health monitoring and ECG anomaly/trend analysis system**.

---

# 27. Key Decisions for Any AI Coding Agent

When implementing this project, follow these decisions unless explicitly changed by the user:

- Backend = **Python FastAPI**
- Frontend = **React**
- Database = **MongoDB**
- Hardware controller = **ESP32**
- ECG = **AD8232**
- SpO₂ + HR = **MAX30102**
- Temperature = **DS18B20**
- Real-time = **FastAPI WebSocket**
- Communication = **Wi-Fi + JSON**
- ML = **Python**, preferably scikit-learn initially
- ML inference = **inside FastAPI**
- No separate ML server initially
- No MPU6050 required
- No GPS required
- No Node.js backend
- No AI chatbot required
- Core system must work without AI
- AI should focus on measurable data analysis such as anomaly detection and trend prediction
- Treat health predictions as experimental/non-diagnostic

---

# 28. Suggested Final Project Name

### Primary

**AI-Enhanced IoT-Based Real-Time Health Monitoring and ECG Anomaly Detection System**

### Alternative

**IoT-Based Real-Time Health Monitoring System with ECG Analysis and ML-Based Trend Prediction**

### Short name

**SmartHealth IoT**

---

# 29. AI Agent Instruction

You are working on the above IoT Health Monitoring System.

Before modifying architecture or adding technologies:

1. Preserve the existing ESP32 + AD8232 + MAX30102 + DS18B20 architecture.
2. Use FastAPI as the backend.
3. Keep ML inside the FastAPI application unless there is a clear technical reason to separate it.
4. Use MongoDB for persistent readings.
5. Use WebSockets for real-time dashboard data.
6. Keep ECG as a time-series signal.
7. Do not introduce Node.js unless explicitly requested.
8. Do not add unnecessary hardware.
9. Prefer incremental implementation and testing.
10. Keep medical claims conservative and clearly non-diagnostic.
11. Maintain clean separation between hardware, backend, ML, frontend, and documentation.
12. When implementing ML, separate training from inference.
13. Store trained models as versioned artifacts.
14. Validate sensor data before storage or ML inference.
15. Design APIs so the ESP32 can communicate with the deployed backend securely.
16. Explain code and architecture clearly enough for a college project/viva.
