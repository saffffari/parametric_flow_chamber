# Flow Chamber operator app

Electron + React + TypeScript operator app for the parametric flow chamber. Drives the Teensy 4.1 firmware over USB serial, manages folder-based studies (JSON + CSV per run), and exposes a synth-style control surface in a Drams/Rams-influenced visual language.

## Stack

- **Electron 33** + electron-forge (with Vite plugin) — shell, packaging, signing
- **React 18 + TypeScript + Vite** — renderer
- **Tailwind v4** + Radix UI primitives + shadcn-style components — UI
- **motion** — animations, rotating-wheel inertia
- **Zustand** — app state (studies, runs, UI)
- **uPlot** — real-time telemetry plotting (~50 KB, made for streaming)
- **serialport** — Teensy serial; works on Mac (`/dev/cu.usbmodem*`) and Windows (`COM*`)
- **fs-extra + csv-parse** — study folder I/O
- **electron-store** — settings persistence
- **Vitest** + **Playwright** — unit + E2E testing

## Develop

```bash
cd app
npm install
npm start     # electron-forge start — launches the app in dev mode with hot reload
```

The dev build defaults to **mock mode**: a simulated Teensy interface produces realistic shear-vs-time waveforms (sine, square, triangle, DC). No hardware required.

## Build

```bash
npm run make
```

Builds platform-native installers under `out/make/`:

- macOS: `.dmg` (Intel + Apple Silicon)
- Windows: `.exe` (Squirrel) and `.msi`

## Test

```bash
npm run typecheck      # tsc --noEmit
npm run lint           # ESLint
npm run test:unit      # Vitest
npm run test:e2e       # Playwright
```

## Architecture

(Stubs only at this point — implementation per `planning/HANDOFF.md` § "v1 app scope (trimmed first slice)" follows in subsequent sessions.)

```
app/
├── electron/             # main process + preload
│   ├── main.ts           # window lifecycle, IPC handlers, native module bridge
│   └── preload.ts        # contextBridge API surface to the renderer
├── src/                  # renderer (React)
│   ├── main.tsx          # React entry
│   ├── App.tsx           # root shell (sidebar + main + footer)
│   ├── components/       # UI components (control panel blocks, knobs, widgets)
│   ├── domain/           # shear math, storage schemas, run lifecycle
│   ├── lib/              # mock interface, serial transport, study I/O
│   └── styles/           # globals.css with design tokens
├── tests/                # Vitest + Playwright tests
├── forge.config.ts       # electron-forge packaging config
├── vite.{main,preload,renderer}.config.ts
└── tsconfig.json
```

## Mock vs hardware mode

`app/src/lib/mock-interface.ts` is the in-process simulator. It produces realistic telemetry for development without the Teensy. The same interface can be backed by `app/src/lib/serial-interface.ts` (real Teensy via `serialport`) when running against hardware.

The HANDOFF v1 scope ships **mock-only**. Real serial connectivity ships in v2 once the firmware command set is finalized.

## Folder-based study format

Studies persist as folders containing JSON + CSV. The wire format is identical to the Python v0.1 controller (preserved at `archive/flow_chamber_v1/python_v0.1_app/` — outside the public repo) so old and new tooling cross-read. Sample at `examples/demo_study/`.

## Design language

See `docs/design_language.md`. Hardware aesthetic: TX-6-influenced precision instrument. Software aesthetic: Drams/Rams sibling visual language. Tokens come from the project Figma file (file key `J3aZzdLaJmidPQcOxphPdE`, root frame node `2004-140`) via the Figma MCP — replace placeholder values in `src/styles/globals.css` once authenticated.
