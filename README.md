<img src="src/assets/logo/nanobox-mark.svg" alt="Nanobox logo" width="72" height="72">

# Nanobox

> A fully customisable desktop companion built first for neurodivergent people
> (ADHD, autism, dyslexia, sensory processing differences) — notes, music,
> calendar, alarms, clocks, shortcuts, and a lego-block custom widget builder,
> all in one persistent, themeable desktop hub.

**Status:** Pre-release, active development (Milestone 3 — theme engine — in progress).

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

**First time here?** All you need is [Node.js](https://nodejs.org/) installed,
then:

```bash
git clone https://github.com/AShah-01/Nanobox.git
cd Nanobox
npm install
npm link
```

From then on, typing `nanobox` in any terminal opens a local setup guide in
your browser (`http://localhost:4317`) with copyable, platform-specific
commands for everything else — installing Rust, the native build tools,
running the app, all of it. Re-run it any time with `nanobox`, or
`npm run guide` from inside the repo if you'd rather not `npm link` globally.

Nanobox isn't published to an app store or as a standalone installer yet —
right now, running it from source via this guide *is* the install process.
Once packaged releases exist, they'll be linked from the guide page and from
this README.

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
