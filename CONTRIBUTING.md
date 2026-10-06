# Contributing to VITAL / MONITOR

Thank you for your interest in contributing to the **VITAL / MONITOR** IoT Clinical Telemetry project! We welcome contributions to the dashboard frontend, hardware firmware (ESP32), backend streaming services, and documentation.

---

## Design & Engineering Principles

Before contributing code, please review our core engineering values:

1. **Readings Before Decoration**: Prioritize raw sensor fidelity, low latency, and clear medical typography over ornamental graphics.
2. **Zero AI Slop**: No arbitrary decorative gradients, frosted glass, emojis, or fabricated metrics.
3. **Hardware Truthfulness**: Clearly distinguish live streaming data from stale or offline states. Never synthesize readings without explicit user declaration.
4. **Clean Code & Fast Lints**: Keep components focused, type-safe, and verify that `oxlint` and `vite build` pass with zero warnings.

---

## Development Workflow

### 1. Fork & Clone

```bash
git clone https://github.com/Biraj2004/IOT-Health-Monitoring.git
cd IOT-Health-Monitoring
```

### 2. Frontend Dashboard Setup

```bash
cd dashboard
npm install
npm run dev
```

The local development server will be available at `http://localhost:5173/`.

### 3. Making Changes

- Create a descriptive branch:
  ```bash
  git checkout -b feat/your-feature-name
  ```
- Adhere to the established CSS token system in [`dashboard/src/index.css`](dashboard/src/index.css).
- Use tabular numerals (`font-feature-settings: 'tnum' 1`) for changing telemetry measurements.

### 4. Verification

Before committing, run the following verification checks:

```bash
# In the dashboard/ directory:
npm run lint    # Must report 0 warnings and 0 errors (oxlint)
npm run build   # Must compile a clean production bundle
```

---

## Commit Guidelines

We use [Conventional Commits](https://www.conventionalcommits.org/) for clean, readable history:

- `feat:` New features or enhancements
- `fix:` Bug fixes
- `docs:` Documentation updates
- `ci:` Vercel or deployment configuration
- `refactor:` Code improvements without behavioral changes
- `chore:` Maintenance or dependency updates

---

## Submitting Pull Requests

1. Push your branch to your fork.
2. Open a Pull Request against the `main` branch.
3. Include a concise description of your changes, referencing any relevant issues.
4. Provide screenshots or screen recordings for any visual changes.

---

## License

By contributing to this project, you agree that your contributions will be licensed under the [MIT License](LICENSE).
