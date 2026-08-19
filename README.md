<img src="src/assets/logo/nanobox-mark.svg" alt="Nanobox logo" width="72" height="72">

# Nanobox

> A fully customisable desktop companion built first for neurodivergent people
> (ADHD, autism, dyslexia, sensory processing differences) — notes, music,
> calendar, alarms, clocks, shortcuts, and a lego-block custom widget builder,
> all in one persistent, themeable desktop hub.

**Status:** Pre-release, active development (Milestone 5 — Calendar + Music integrations, including real Google Calendar/Spotify OAuth — complete; see [ROADMAP.md](ROADMAP.md)).

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

### Windows

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

This is a **dev server** — it's meant to stay attached to the terminal you
launched it from (that's what makes hot-reload work), and closing that
terminal closes the app. That's normal, not a bug. If you want Nanobox to
behave like a normal installed app — sitting in the taskbar/tray,
surviving after you close whatever launched it — build and run the real
app instead: `npm run tauri build`, then run the installer it produces (or
double-click the built `.exe`/`.app` directly, not from inside a terminal).
See "Grab a build" below for a version you don't even have to build
yourself.

### Build

```bash
npm run tauri build
```

### Mac
... (Mac side is still pending. Please wait patiently. Thanks)


### Grab a build without building it yourself

Every push to `main` builds Nanobox on both Windows and macOS via
[GitHub Actions](https://github.com/AShah-01/Nanobox/actions/workflows/build.yml)
and uploads the result — an MSI + NSIS installer for Windows, a DMG for
macOS — as a workflow artifact. Open the latest successful run and download
`nanobox-windows` or `nanobox-macos` from the Artifacts section at the
bottom of the page.

These are unsigned release builds (no code signing/notarization yet — that's
Milestone 8, Polish & release, not done yet) meant for trying Nanobox out or
testing a PR, not a polished, signed release. They're regular optimized
builds like `npm run tauri build` produces, not debug builds, so they behave
like a normal installed app — no stray console window, no dependency on
whatever launched them.

## Docs

- [docs/WIDGETS.md](docs/WIDGETS.md) — every built-in widget and what it does
- [docs/BLOCK_ENGINE.md](docs/BLOCK_ENGINE.md) — how the visual block/lego
  engine works under the hood (AST, evaluator, standard library)

## Roadmap & progress

- [ROADMAP.md](ROADMAP.md) — milestone-by-milestone build order
- [PROGRESS.md](PROGRESS.md) — session-by-session log of what's shipped
- [PLAN.md](PLAN.md) — current focus and working agreement

## Contributing

Nanobox is open to collaborators — if you're a dev who cares about
neurodivergent-friendly tooling (or you just like the idea of a themeable
desktop widget hub), issues and PRs are genuinely welcome. It's early and
the codebase moves fast, so an issue proposing what you'd like to work on
before a big PR will save both of us time.

**Want to extend Nanobox without touching the core?** The Custom Widget
type (add it from the overlay's "+ Add widget" menu) lets you write your
own HTML/CSS/JS and drop it straight onto the desktop — it runs sandboxed
in an iframe with no access to your files, Nanobox's data, or Tauri APIs.
It's a simple precursor to the full visual "lego block" widget builder
planned for Milestone 7 (see [ROADMAP.md](ROADMAP.md)) — capable enough to
build something real today, and a good on-ramp if you want to help shape
where the full block engine goes. Each one you save also lands as a real
file in your `custom-widgets` app-data folder, not just in the database.

## Security

If you find a security issue, please follow [SECURITY.md](SECURITY.md)
rather than filing a public issue.

## License

[MIT](LICENSE.md)
