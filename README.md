# Nanobox

> A fully customisable desktop companion built first for neurodivergent people
> (ADHD, autism, dyslexia, sensory processing differences) — notes, music,
> calendar, alarms, clocks, shortcuts, and a lego-block custom widget builder,
> all in one persistent, themeable desktop hub.

**Status:** Pre-release, active development (Milestone 1 — foundation shell).

---

## Tech stack

| Layer | Technology |
|---|---|
| App framework | [Tauri 2](https://v2.tauri.app/) (Rust + native WebView) |
| Frontend | React 19 + TypeScript |
| Styling | CSS custom properties + PostCSS (theme engine) |
| Storage | SQLite via `tauri-plugin-sql` |
| Widget sandbox | Custom JS runtime (Compartment API) |
| CI/CD | GitHub Actions (Windows + macOS build matrix) |

## Platform targets

- Windows 10+ (x64)
- macOS 12+ (Apple Silicon + Intel)

## Project layout

```
nanobox/
├── src/
│   ├── core/               # App shell, startup, tray, window management
│   ├── widgets/             # Widget registry, lifecycle, lego engine
│   │   ├── built-in/        # Clock, Notes, Music, Calendar, etc.
│   │   └── sandbox/         # Compartment runtime for user widgets
│   ├── themes/               # CSS theme files + token maps
│   ├── tokens/               # Design token JSON → CSS pipeline
│   ├── components/           # Shared React components
│   ├── integrations/
│   │   ├── music/            # Spotify, Apple Music, YouTube adapters
│   │   └── calendar/         # Google Calendar, iCal parsers
│   └── storage/               # SQLite schema, migrations, CRUD helpers
├── src-tauri/
│   ├── src/                  # Rust: commands, file I/O, system APIs
│   └── Cargo.toml
├── tests/
├── public/fonts/
├── ROADMAP.md
├── PROGRESS.md
├── PLAN.md
└── package.json
```

## Getting started

### Prerequisites

- [Node.js](https://nodejs.org/) 20+
- [Rust](https://rustup.rs/) (stable toolchain)
- Platform build tools:
  - **Windows**: [Microsoft C++ Build Tools](https://visualstudio.microsoft.com/visual-cpp-build-tools/) (Desktop development with C++ workload) + [WebView2](https://developer.microsoft.com/microsoft-edge/webview2/) (preinstalled on Windows 10/11)
  - **macOS**: Xcode Command Line Tools (`xcode-select --install`)

### Setup

```bash
git clone https://github.com/AShah-01/Nanobox.git
cd Nanobox
npm install
```

### Run in development

```bash
npm run tauri dev
```

### Build

```bash
npm run tauri build
```

## Roadmap & progress

- [ROADMAP.md](ROADMAP.md) — milestone-by-milestone build order
- [PROGRESS.md](PROGRESS.md) — session-by-session log of what's shipped
- [PLAN.md](PLAN.md) — current focus and working agreement

## Contributing / security

This project isn't yet open for external contributions. If you find a
security issue, please follow [SECURITY.md](SECURITY.md) rather than filing
a public issue.

## License

[MIT](LICENSE.md)
