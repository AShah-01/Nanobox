# Phases — Nanobox

Milestones are the unit of "done, builds cleanly on Windows + macOS, safe to
move on." Each milestone lists numbered tasks. A milestone is not complete
until the app builds cleanly on both platforms (verified via GitHub Actions CI).

---

## Working Agreement

- Ship in small, reviewable increments — one milestone's worth of tasks at a time.
- Every milestone must build cleanly on **both** Windows and macOS before the next one starts.
- Commit messages describe the "why," follow Conventional Commits (`feat:`, `fix:`, `chore:`, `perf:`, `docs:`).
- Prefer editing the existing folder structure over inventing new top-level directories.
- Before starting a milestone, check whether another in-flight session has claimed it — two agents built Milestone 5 independently once; avoid repeating that.

---

## Phase 1 — Foundation shell ✅

1. Scaffold Tauri 2 + React + TypeScript project; folder structure matches
   `src/core`, `src/widgets`, `src/themes`, `src/tokens`, `src/components`,
   `src/integrations`, `src/storage`, `src-tauri`, `tests`, `public/fonts`
2. App shell: system tray icon (show/hide toggle, quit), desktop overlay window
   (transparent, sits above wallpaper below other windows), runs on startup
   (Windows registry Run key / macOS launchd agent)
3. SQLite storage layer via `tauri-plugin-sql`: initial schema with an empty
   `notes` table, migration wired into `src/storage`
4. Render one hardcoded Clock widget in `src/widgets/built-in` so there is a
   visible widget on screen
5. GitHub Actions CI: build matrix for `windows-latest` and `macos-latest`,
   confirms the app builds cleanly on both before Phase 2 starts

---

## Phase 2 — Core widgets ✅

- [x] Notes widget: create, edit, delete, pin, colour label (SQLite-backed)
- [x] Alarm widget: list view, time picker, sound picker, day-of-week toggles, snooze
- [x] App Shortcuts widget: drag-in icons, launch on click, editable labels
- [x] Countdown widget: timer counting down to a date
- [x] Habit Tracker widget: daily checkbox habits with streak counter
- [x] Focus Mode widget: Pomodoro-style timer, optionally hides other widgets
- [x] Widget grid system: 8px snapping, resize handles, per-widget opacity slider

---

## Phase 3 — Theme engine ✅

- [x] CSS custom property token pipeline (`--nb-surface`, `--nb-text`, `--nb-accent`,
      `--nb-border-style`, `--nb-radius`, `--nb-font-family`, `--nb-accent-text`,
      `--nb-font-scale`, `--nb-surface-alt`)
- [x] Seventeen themes: Liquid Glass, Matte, Glossy, Retro, Cyberpunk, Steampunk,
      Standard, Nord, Dracula, Solarized Dark, Forest, Deep Ocean, Sunset,
      Monochrome, Cotton Candy, Industrial, Galaxy
- [x] Hot-swappable theme switching (no reload), theme switcher in Settings
- [x] Accessibility baseline: WCAG AA contrast on every theme, `:focus-visible`
      rings, `prefers-reduced-motion` support
- [x] Per-theme user customisation: accent colour picker, font scale, corner radius,
      widget border style (`src/components/ThemeCustomizer.tsx`)
- [x] Export/import as `.nanotheme` (JSON: theme id + customisation) via native
      save/open dialogs (`src/core/themeExport.ts`)
- [x] Colourblind palette: Okabe-Ito blue (#0072B2) toggle in Settings
      (`src/core/colorblindPalette.ts`); replaces the earlier SVG-filter "preview" approach

---

## Phase 4 — Everyday ADHD / neurodivergent toolkit ✅ (core set)

- [x] Visual Timer widget: Time Timer-style shrinking colour disk/arc for a chosen
      duration — readable at a glance without reading digits
- [x] Today Timeline widget: Tiimo-inspired vertical strip of today's time blocks,
      icon + colour per block, current-time indicator line
- [x] Brain Dump widget: near-zero-friction single-line capture; lighter-weight than Notes
- [x] Task Breakdown widget: one big task as header, sub-step checkboxes underneath
- [x] Mood Check-in widget: single-tap emoji + optional short note, 7-day history strip
- [x] Gentle Reminders widget: interval-based nudges ("stand up every 45 min") —
      distinct mechanic from the Alarm widget
- [ ] Companion widget (stretch — deferred): cosmetic plant/creature that grows from
      Habit Tracker streak data; no new mechanics required

Also delivered outside original scope: draggable title bar (real bug fix), MVP
Custom Widget type (sandboxed iframe, HTML/CSS/JS), per-widget colour/style settings.

---

## Phase 5 — Integrations ✅

- [x] Secure token storage: OS-native keychain (Windows Credential Manager /
      macOS Keychain) via the `keyring` Rust crate; tokens never touch SQLite
- [x] Calendar widget: local `.ics` parsing + Google Calendar OAuth 2.0 PKCE
      (read-only); unified `CalendarEvent` interface; month/week/day views
- [x] Music widget: unified `NowPlayingData` interface; Spotify OAuth PKCE implemented;
      OS media session (Windows SMTC) for picking up any playing audio
- [x] Graceful degradation: both widgets cache last-known-good data and fall back
      with a visible "offline" indicator
- [ ] Apple Music — blocked: requires private-key-signed JWT from Apple Developer account
- [ ] YouTube Music — blocked: no official "now playing" API
- [ ] OAuth flows compile clean but **have not been exercised against real accounts** —
      first real use is the actual first test

---

## Phase 6 — Window chrome & widget UX fixes ✅

- [x] Real window controls: minimize, maximize/restore, hide-to-tray
- [x] Window dragging fixed: switched from passive `data-tauri-drag-region` to explicit
      `startDragging()` API to avoid conflict with `dragDropEnabled`
- [x] `skipTaskbar` cleared so the app appears in the Windows taskbar
- [x] Custom Widget: title field added; widget saves as `.nanowidget.json` in app-data
- [x] WidgetGrid floating drag handle removed; dragging via widget's own title bar
- [x] Per-widget settings: Opacity, Color (accent shade picker), Style (border presets)

---

## Phase 7 — Lego block widget builder ✅

- [x] Block engine AST: nodes, edges, port types, evaluation order
      (`src/integrations/blockEngine/types.ts`, `evaluator.ts`); 22+ registered blocks
- [x] Visual canvas (React Flow): click-to-add palette, drag-to-connect wiring with
      live port-type validation, pan/zoom/minimap, save/load/delete to SQLite
      (`block_programs`, migration v9)
- [x] Custom block creator: named inputs + sandboxed JS body editor
      (`new Function("inputs", body)` sandbox); syntax validation + 8 KB cap;
      persisted to `custom_block_defs` (migration v10); accessible via Block Builder
- [x] Widget export/import as `.nanowidget` (JSON: name + full `BlockProgram` AST)
- [x] Block Widget renderer: `block-widget` widget type re-evaluates a saved program
      against `liveBridge` on a configurable interval (5 s–5 min)

---

## Phase 8 — Polish & release (in progress)

### Bug fixes (complete)

- [x] **P0** Music widget: provider list split into "No setup required" vs "Requires developer account"; Spotify connect form now shows plain-English instructions
- [x] **P0** Google Calendar: numbered 5-step OAuth setup guide shown inside the widget
- [x] **P0** CustomWidget sandbox: CSP `<meta>` tag injected into srcdoc — blocks all outbound fetch/XHR/WebSocket; hint text updated
- [x] **P1** All widgets + WidgetGrid: DB-load failures now show a user-visible error banner instead of staying blank
- [x] **P1** Block engine: 2 000 ms time-budget check on custom block evaluation (true `while(true)` cannot be interrupted — documented)
- [x] **P1** AppShortcuts: ⚠ warning when icon extraction returns null; auto-clears after 5 s
- [x] **P1** ThemeCustomizer: export errors are now shown to the user (were silently swallowed)
- [x] **P1** Colourblind palette off: now restores the user's saved custom accent instead of falling back to theme default
- [x] **P2** Overlay panel: 120 ms fade-in on `.overlay__body`; `prefers-reduced-motion` guard

### Remaining (pre-release)

- [ ] First-run onboarding wizard: theme picker, accent colour, add first widget
- [ ] Full keyboard navigation across all widgets and settings
- [ ] Windows packaging: signed NSIS/MSIX installer; SmartScreen warning resolved
- [ ] macOS packaging: DMG with code signing and notarization
- [ ] Auto-update: wire up `tauri-plugin-updater`
- [ ] One-command install: `winget install Nanobox` (Windows), `brew install --cask nanobox` (macOS)
- [ ] Documentation site: Getting Started, Widget Reference, Block Engine Guide
- [ ] Public release: README overhaul with demo GIF

### Open (needs hardware/accounts to verify)

- macOS overlay behaviour (tray, always-on-bottom, drag) — untested on real hardware
- OAuth token refresh/revoke paths — unverified against real Spotify/Google accounts
- Window dragging — compiled and type-checked, needs human confirmation

---

## What's Next

Phase 8 remaining pre-release work, priority order:

1. Onboarding wizard
2. Keyboard navigation pass
3. Code signing (Windows first, then macOS)
4. Auto-update
5. Docs site + public release
