<img src="src/assets/logo/nanobox-mark.svg" alt="Nanobox logo" width="72" height="72">

# Nanobox

> A fully customisable desktop companion built first for neurodivergent people
> (ADHD, autism, dyslexia, sensory processing differences) — notes, music,
> calendar, alarms, clocks, shortcuts, and a lego-block custom widget builder,
> all in one persistent, themeable desktop hub.

**Status:** Pre-release, active development — Milestones 1–7 complete (block engine, theme engine, integrations, ADHD toolkit, window chrome). Milestone 8 (packaging, docs, release) in progress. See [ROADMAP.md](ROADMAP.md).

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

### 🎵 Help wanted — Music widget

The Music widget currently supports **Spotify** (OAuth PKCE) and the
**OS media session** (Windows SMTC — picks up anything playing audio).
Two services we'd love to add but are genuinely blocked on:

- **Apple Music** — requires a private-key-signed JWT from an Apple Developer
  account. There's no public API path that works client-side without one.
  If you have an Apple Developer account and want to tackle this, the stub
  is at `src/integrations/music/appleMusic.ts` with full notes on the blocker.
- **YouTube Music** — no official "now playing" API exists. A browser
  extension or companion approach may be the only viable route. If you've
  solved this elsewhere, we'd love to know how.

Open an issue tagged `music` if you have a working approach for either.

### 🍎 Help wanted — macOS

The macOS build compiles in CI and produces a DMG artifact, but it has never
been run hands-on by a human on a real Mac. Everything that depends on
platform-level behaviour is untested on Apple hardware:

- **Tray icon and overlay window** — `skipTaskbar`, always-on-top, and the
  transparent overlay approach all behave differently on macOS vs Windows.
  The window may not sit above the wallpaper the way it does on Windows, or
  the tray icon may not appear in the right place.
- **Launch on login** — uses a launchd agent on macOS; the autostart path
  has not been verified.
- **Window dragging** — `startDragging()` is a Tauri API that should work
  cross-platform, but the feel (title bar height, drag region) hasn't been
  tuned for macOS.
- **Code signing and notarization** — unsigned DMGs require right-click →
  Open on macOS 13+. A proper release needs a paid Apple Developer account
  for signing and notarization. If you can provide or sponsor this, open an
  issue.

If you have a Mac and want to be the first real tester, clone the repo, grab
a CI artifact (or build from source with `npm run tauri build`), and file
everything that's broken. A single Mac tester doing a 30-minute pass would
clear most of the unknowns in one go.

### 🖥️ Help wanted — True standalone app (no terminal required)

Right now, the only way to run Nanobox persistently — as a real app that
lives in your taskbar and tray, survives closing the terminal, and starts on
login — is to build it (`npm run tauri build`) and run the produced installer.
The dev path (`npm run tauri dev`) is inherently terminal-attached by design.

The gap we want help closing:

- **Signed Windows installer (MSIX or NSIS)** — the CI build produces an
  unsigned NSIS installer, but unsigned executables trigger SmartScreen
  warnings on Windows. A proper release needs an EV or OV code-signing
  certificate. If you can help with this (or know a low-cost path for indie
  projects), open an issue.
- **One-command install from a release** — ideally `winget install Nanobox`
  on Windows and `brew install --cask nanobox` on macOS. Getting into those
  registries requires a signed, versioned release first.
- **Auto-update** — Tauri has a built-in updater plugin (`tauri-plugin-updater`)
  that we haven't wired up. Once signing is sorted, this is the next step so
  users don't have to manually reinstall on every release.

If you've shipped a Tauri app through to a real signed release (especially on
Windows, especially with auto-update), your experience would be directly
applicable here. Open an issue or a discussion.

### 🐛 Help wanted — Real-world debugging

Nanobox has been built and tested in a development environment — it has never
been lived in by real users at scale. If you try it and something feels off,
broken, or just odd, **please open an issue**. Specifically looking for help
with:

- **macOS**: the codebase targets macOS 12+ but has only been built there
  in CI, never tested hands-on. Anything broken on Mac is a priority fix.
- **OAuth flows**: Spotify and Google Calendar OAuth have been implemented
  and compile clean, but the flows have not been exercised against real
  accounts in a real environment. First-time auth, token refresh, and revoke
  paths are the most likely to have edge-case bugs.
- **Window behaviour**: window dragging, tray icon, startup-on-login, and
  the always-on-top overlay all depend on OS-level behaviour that varies
  by Windows version and display setup. Bug reports with your OS version
  and display config are very helpful.
- **Performance on real hardware**: the app has been profiled in dev mode
  only. If it feels sluggish on your machine, open an issue with your specs.

If you want to do a broader debugging pass — running it for a week and
filing everything that feels wrong — that would be genuinely one of the
most valuable contributions right now.

### 🧩 Extend without touching core

The **Custom Widget** type (add it from the "+ Add widget" overlay) lets you
write your own HTML/CSS/JS and drop it straight onto the desktop — sandboxed
in an iframe with no access to your files, Nanobox's data, or Tauri APIs.
The **Block Builder** (Ctrl+Shift+B) is the full visual alternative — drag,
wire, and run logic blocks without writing code, then pin the output as a
live widget. Each program saves as a `.nanowidget` file you can share.

## Security

If you find a security issue, please follow [SECURITY.md](SECURITY.md)
rather than filing a public issue.

## License

[MIT](LICENSE.md)
