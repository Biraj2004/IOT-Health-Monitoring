# VITAL / MONITOR — Clinical Web Dashboard

<p align="left">
  <a href="https://vitalmonitor.vercel.app"><img src="https://img.shields.io/badge/Live_Demo-vitalmonitor.vercel.app-008F72?style=flat-square&logo=vercel" alt="Live Demo" /></a>
  <img src="https://img.shields.io/badge/React-19.2-61DAFB?style=flat-square&logo=react&logoColor=black" alt="React 19" />
  <img src="https://img.shields.io/badge/Vite-8.3-646CFF?style=flat-square&logo=vite&logoColor=white" alt="Vite 8" />
  <img src="https://img.shields.io/badge/Linter-oxlint-orange?style=flat-square" alt="Oxlint" />
  <a href="../LICENSE"><img src="https://img.shields.io/badge/License-MIT-blue?style=flat-square" alt="MIT License" /></a>
  <a href="../CONTRIBUTING.md"><img src="https://img.shields.io/badge/PRs-Welcome-brightgreen?style=flat-square" alt="PRs Welcome" /></a>
</p>

A high-performance **React 19** and **Vite 8** clinical dashboard interface designed for real-time IoT physiological telemetry surveillance. Adheres strictly to the [impeccable.style](https://impeccable.style) design standard and [DESIGN-GUIDE.md](../guide/DESIGN-GUIDE.md).

---

## Key Features

- **Clinical Typography & Layout**: High-contrast, tabular numeric vitals with crisp 1px borders, zero emojis, and zero decorative glassmorphism.
- **Continuous 60 FPS ECG Oscilloscope**: Calibrated HTML5 canvas simulating clinical electrocardiographs on a medical millimeter grid (`25 mm/s · 10 mm/mV`) with a sweeping red cursor dot.
- **Dual-Mode Telemetry Engine**: Connects via WebSockets to `ws://localhost:8000/ws/health` when online, with automatic, realistic physiological drift fallback when disconnected.
- **Interactive Alarm Simulation**: In-dashboard triggers for acute tachycardia (>100 bpm) and hypoxia (<90% SpO₂), with instant baseline reset.
- **Icon-Centric Branding & SEO**: Complete Apple Touch icon, Web Manifest, and 1200×630 Open Graph preview with zero redundant banner text.
- **Cross-Device Responsiveness**: Fluid layouts across 1440px Desktop, 768px Tablet, and 390px/336px Mobile viewports with zero layout shifts (CLS = 0).

---

## Development Scripts

```bash
# Install dependencies
npm install

# Start local Vite development server (http://localhost:5173/)
npm run dev

# Fast static code analysis (0 warnings, 0 errors)
npm run lint

# Compile production-ready bundle into dist/
npm run build

# Preview production build locally
npm run preview
```

---

## Related Documentation

- [Root Architecture & Hardware Specification](../README.md)
- [Comprehensive IoT Project Context](../guide/iot_health_monitoring_ai_agent_project_context.md)
- [Clinical UI Design Guide](../guide/DESIGN-GUIDE.md)
- [Universal SEO & GEO Guide](../guide/seo-optimization-basic-guide.md)

---

## Contributing & License

- Please see [CONTRIBUTING.md](../CONTRIBUTING.md) for contribution guidelines.
- Open-source software licensed under the [MIT License](../LICENSE).
- Project contributors and engineering team details are documented in the [Root README](../README.md#11-project-team--contributors).

