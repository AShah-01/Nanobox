# Architecture — Nanobox

## App Flow

```
User launches app
    └─► Tauri bootstraps native window (transparent, borderless, always-on-bottom)
            └─► WebView loads dist/index.html
                    └─► main.tsx pre-warms SQLite DB (getDb())
                            └─► React mounts App.tsx
                                    ├─► DB init: run migrations, load settings
                                    ├─► Widget canvas renders (saved layout from DB)
                                    ├─► TitleBar (drag handle + window controls)
                                    ├─► System tray icon appears
                                    └─► Widgets fetch their own data on mount
```

### Startup sequence detail
1. `main.tsx` — calls `getDb()` before React mounts to pre-warm the SQLite connection (avoids blank screen delay on first render)
2. `App.tsx` — reads `onboarding_done` from DB; initial state is `true` (optimistic) so the canvas renders immediately
3. Widget canvas — each widget calls its own data hook; failures show an error state, never a blank widget
4. Theme — applied from `localStorage` by `initTheme()` synchronously before first paint (no flash of wrong theme)
5. Colourblind palette — applied by `initColorblindPalette()` immediately after theme

---

## Tech Stack

| Layer | Technology | Version |
|---|---|---|
| App framework | Tauri | 2.x |
| Rust edition | 2021 | stable toolchain |
| Frontend | React | 19.x |
| Language | TypeScript | ~5.8 |
| Build tool | Vite | 7.x |
| Styling | CSS custom properties (no CSS-in-JS) | — |
| Database | SQLite via tauri-plugin-sql | 2.x |
| Visual canvas | @xyflow/react (React Flow) | 12.x |
| Keychain | keyring (apple-native + windows-native) | 3.x |
| Notifications | tauri-plugin-notification | 2.x |
| Dialogs | tauri-plugin-dialog | 2.x |
| Autostart | tauri-plugin-autostart | 2.x |
| File open/save | tauri-plugin-opener + Tauri dialog | 2.x |
| Testing | Vitest + @testing-library/react | 4.x / 16.x |
| CI/CD | GitHub Actions | — |

---

## Folder and File Structure

```
nanobox/
├── src/
│   ├── App.tsx                     # Root component; canvas, settings, modals
│   ├── main.tsx                    # React entry; DB pre-warm
│   │
│   ├── assets/
│   │   └── logo/                   # SVG logo marks
│   │
│   ├── components/                 # Shared UI components
│   │   ├── TitleBar.tsx            # Drag handle + window controls (minimize, maximize, hide)
│   │   ├── TitleBar.css
│   │   ├── SettingsPanel.tsx       # Theme, accent, colourblind toggle, autostart
│   │   ├── WidgetCanvas.tsx        # Drag-and-drop widget layout
│   │   ├── WidgetCanvas.css
│   │   ├── AddWidgetOverlay.tsx    # "+ Add widget" picker
│   │   └── blockBuilder/
│   │       ├── BlockBuilder.tsx    # React Flow canvas; save/load/delete programs
│   │       ├── CustomBlockCreator.tsx  # Modal for authoring custom block defs
│   │       └── nodeTypes/          # React Flow custom node components
│   │
│   ├── core/
│   │   ├── colorblindPalette.ts   # Okabe-Ito palette toggle (localStorage + CSS vars)
│   │   ├── tray.ts                # System tray icon setup
│   │   └── window.ts              # Window management helpers
│   │
│   ├── integrations/
│   │   ├── music/
│   │   │   ├── spotify.ts         # Spotify OAuth PKCE + playback API
│   │   │   ├── appleMusic.ts      # Stub — blocked on Apple Developer JWT
│   │   │   └── osMedia.ts         # Windows SMTC (system media session)
│   │   ├── calendar/
│   │   │   ├── googleCalendar.ts  # Google Calendar OAuth PKCE
│   │   │   └── ical.ts            # iCal parser
│   │   └── blockEngine/
│   │       ├── types.ts           # BlockDef, BlockNode, Edge, BlockProgram, EvalResult
│   │       ├── evaluator.ts       # AST evaluator (live execution)
│   │       ├── stdlib.ts          # Standard block library (math, string, display, etc.)
│   │       ├── customBlockRegistry.ts  # In-memory map of custom block evaluators
│   │       └── customBlockLoader.ts    # Loads custom defs from SQLite, registers them
│   │
│   ├── storage/
│   │   ├── db.ts                  # SQLite singleton (getDb); all migrations run here
│   │   ├── widgets.ts             # Widget layout CRUD
│   │   ├── settings.ts            # App settings CRUD
│   │   ├── notes.ts               # Notes CRUD
│   │   ├── alarms.ts              # Alarms CRUD
│   │   ├── blockPrograms.ts       # Block programs CRUD (migration v9)
│   │   └── customBlockDefs.ts     # Custom block defs CRUD (migration v10)
│   │
│   ├── themes/
│   │   ├── base.css               # :root token definitions (fallback values)
│   │   ├── themes.ts              # ThemeId union type + metadata map
│   │   └── [theme-name].css       # One file per theme (17 total); :root[data-theme="X"]
│   │
│   └── widgets/
│       ├── registry.ts            # WidgetId type, DEFAULT_SIZE map, component map
│       ├── built-in/
│       │   ├── ClockWidget/
│       │   ├── NotesWidget/
│       │   ├── MusicWidget/
│       │   ├── CalendarWidget/
│       │   ├── AlarmWidget/
│       │   ├── AppShortcutsWidget/
│       │   ├── PomodoroWidget/
│       │   └── BlockWidget/       # Runs a saved Block program as a live widget
│       └── sandbox/
│           └── CustomWidget/      # HTML/CSS/JS user widget in a sandboxed iframe
│
├── src-tauri/
│   ├── src/
│   │   ├── lib.rs                 # Tauri app setup; all plugin registrations; DB migrations
│   │   ├── commands.rs            # #[tauri::command] handlers (file I/O, etc.)
│   │   ├── icons.rs               # Windows icon extraction (windows-icons crate)
│   │   └── system_media.rs        # Windows SMTC reader (windows crate)
│   ├── Cargo.toml                 # Rust deps + build profiles (release: strip, lto, opt-z)
│   ├── Cargo.lock
│   ├── tauri.conf.json            # Window config, bundle targets, CSP
│   ├── capabilities/              # Tauri v2 capability files (FS, dialog, etc.)
│   └── icons/                     # App icon assets (png, ico, icns)
│
├── .cargo/
│   └── config.toml                # `cargo xtrim` alias; build job comment
│
├── .github/
│   └── workflows/
│       └── build.yml              # Windows + macOS CI matrix
│
├── docs/
│   ├── WIDGETS.md                 # Widget reference
│   └── BLOCK_ENGINE.md            # Block engine internals
│
├── public/
│   └── fonts/                     # Bundled web fonts (Cyberpunk, Steampunk themes, etc.)
│
├── tests/                         # Vitest unit tests
│
├── PRD.md                         # Product requirements
├── Architecture.md                # This file
├── Rules.md                       # Coding rules and AI guidance
├── Phases.md                      # Milestone plan
├── Design.md                      # Theme tokens and design system
├── Memory.md                      # Contributor onboarding snapshot
├── README.md                      # User-facing setup guide
└── package.json
```

---

## Key Architectural Decisions

### Tauri v2 (not Electron)
Tauri uses the OS's native WebView (Edge WebView2 on Windows, WKWebView on macOS)
rather than bundling Chromium. This keeps the installer small (~5–10 MB vs ~80 MB+).
The trade-off is that rendering is WebView-version-dependent — WebView2 on Windows
is auto-updated by Windows, WKWebView on macOS is tied to the OS version.

### SQLite for all persistence
All widget layouts, settings, notes, alarms, block programs, and custom block defs
are stored in a single SQLite database managed via `tauri-plugin-sql`. Migrations
are numbered sequentially in `lib.rs`. The DB file lives in the OS app-data directory.

### CSS custom property theme engine
All visual tokens (`--nb-surface`, `--nb-accent`, `--nb-radius`, etc.) are defined
on `:root` in `base.css` and overridden per-theme in `[theme].css` using
`:root[data-theme="theme-name"]`. No runtime JS theme logic — switching themes
is just setting `document.documentElement.dataset.theme`.

### No external state management
No Redux, Zustand, or Context API for global state. Each widget manages its own
state with `useState`/`useEffect`. Settings are read from DB on mount and written
on change. This keeps the component tree flat and avoids prop-drilling via a
deliberate component-local design.

### Block engine sandbox
Custom block JS bodies run inside `new Function("inputs", body)` — a minimal
sandbox that prevents access to the outer scope but does not block network calls
or timers. This is a known P1 gap: true isolation (a Web Worker or iframe sandbox)
is a Milestone 8 item.

### Window always-on-bottom, not always-on-top
`alwaysOnBottom: true` in tauri.conf.json places the window above the wallpaper
but below all normal windows. This is the correct behaviour for a widget canvas —
it is never in the way.
