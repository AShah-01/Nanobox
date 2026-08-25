# Rules — Nanobox

These rules apply to all contributors and AI agents working on the codebase.
They reflect decisions already made and should not be revisited unless there
is a strong, specific reason.

---

## What to Do

- **Write TypeScript for all frontend code.** No `.js` files in `src/`.
- **Use React functional components and hooks only.** No class components.
- **Read from SQLite via the storage helpers** in `src/storage/`. Never write raw SQL
  directly inside a widget or component — it belongs in a storage module.
- **Keep widget components self-contained.** Each widget manages its own data-fetching
  and state. No global state library.
- **Follow the existing file naming convention:** `PascalCase` for component files,
  `camelCase` for utility/storage/integration modules.
- **Co-locate CSS with its component** (`Widget.tsx` alongside `Widget.css`).
  No CSS modules, no styled-components.
- **Use CSS custom property tokens for all colours.** Reference `--nb-surface`,
  `--nb-text`, `--nb-accent`, etc. Never hardcode a colour in a component.
- **New DB tables require a new migration** in `src-tauri/src/lib.rs`. Increment
  the migration number; never modify an existing migration.
- **Test with Vitest** in `tests/`. At minimum, unit-test any non-trivial pure
  function (evaluator logic, block stdlib, data transforms).
- **Keep Rust commands thin.** `src-tauri/src/commands.rs` should be thin wrappers
  that call into OS APIs or return data. No business logic in Rust.
- **Use `invoke()` from `@tauri-apps/api/core`** for all frontend↔Rust calls.

---

## What to Avoid

- **No CSS-in-JS.** No styled-components, Emotion, or similar. CSS custom properties
  + `.css` files is the entire styling system.
- **No global state managers.** No Redux, Zustand, Recoil, or React Context for app
  state. Widget-local state only.
- **No external API calls from the frontend except through defined integrations.**
  Music and calendar integrations in `src/integrations/` are the only permitted
  outbound HTTP callers. Custom Widget HTML/JS sandboxed iframes are isolated
  and must not be given Tauri API access.
- **No `console.log` left in merged code.** Use `console.error` for actual errors only.
- **No `any` in TypeScript unless justified by a comment explaining why.**
- **Do not modify existing DB migrations.** Only add new ones.
- **Do not import from `@tauri-apps/api` directly in non-Tauri-aware code.**
  Tauri APIs are only called from `src/core/`, `src/integrations/`, `src/storage/`, and
  widget components that explicitly need them.
- **No hardcoded secrets or API keys in source code.** Client IDs that are already
  empty strings (`DEFAULT_SPOTIFY_CLIENT_ID`) must stay that way until proper env/config
  handling is added.
- **Do not use `!important` in CSS.** Cascade specificity via `:root[data-theme]` selectors.
- **No `npm install [package]` without checking the license and bundle-size impact.**
  Tauri apps care about binary size; new JS deps increase WebView payload.

---

## Libraries to Use

| Purpose | Library | Notes |
|---|---|---|
| Frontend framework | React 19 | Already in `package.json` |
| Language | TypeScript ~5.8 | Strict mode on |
| Build | Vite 7 | Config in `vite.config.ts` |
| Visual canvas | @xyflow/react 12 | For Block Builder only |
| Testing | Vitest 4 + @testing-library/react | |
| Tauri APIs | @tauri-apps/api 2, @tauri-apps/plugin-* | Do not mix v1 API calls |
| DB | tauri-plugin-sql (SQLite) | Access only via `src/storage/db.ts` |
| Dialogs | tauri-plugin-dialog | For file open/save |
| Notifications | tauri-plugin-notification | For alarms |

**Do not add** Axios, lodash, date-fns, or any UI component library without discussion.
Prefer native browser APIs and small focused utilities over large dependencies.

---

## AI Agent Boundaries

When AI agents (Claude, GPT, etc.) work on this codebase:

- **Do not refactor code that is not part of the task.** Fix only what was asked.
- **Do not introduce abstractions beyond the task scope.** Three similar lines is better
  than a premature helper.
- **Do not add comments that describe what the code does.** Only comment the *why*
  (a hidden constraint, a workaround, a non-obvious invariant).
- **Do not create new documentation files unless explicitly asked.**
- **Do not push to `main` directly.** All agent work should go to a feature branch
  and be reviewed before merging, unless the user has explicitly said otherwise.
- **Do not run `cargo clean` unless specifically requested.** It discards 15+ GB of
  compilation cache and forces a full rebuild.
- **Verify TypeScript compiles** (`npx tsc --noEmit`) before declaring a task done.
- **Check that `npm install` has been run** after any branch merge that changes
  `package.json`; missing packages cause misleading TypeScript errors.

---

## Error Handling Procedure

1. **Widget errors:** catch in the widget component, show a visible error state
   (a red border or "⚠ failed to load" message). Never show a blank widget.
2. **DB errors:** log with `console.error`, surface to the UI if the failure
   means data was not saved (e.g. notes, alarms). Silent failures are P1 bugs.
3. **OAuth errors:** show a human-readable message in the widget ("Connect Spotify
   to see now-playing"). Do not expose raw error objects to the user.
4. **Rust command errors:** return a `Result<T, String>` from `#[tauri::command]`
   and handle the `Err` case on the frontend.
5. **Block engine errors:** catch evaluation errors per-block, show the erroring
   block highlighted in the canvas, log the error message.

### Error Priority (for triage)

| Priority | Description |
|---|---|
| P0 | Prevents core use (auth silently broken, blank canvas, data loss) |
| P1 | Significant UX gap (silent failures, missing error states) |
| P2 | Security gap or edge-case crash |
| P3 | Polish / nice-to-have |

Known P0 gaps: `DEFAULT_SPOTIFY_CLIENT_ID = ""` causes silent music auth failure;
Google Calendar requires a user-supplied client_id with no in-app guidance.

---

## Git Workflow

- `main` is the stable branch. CI builds from `main`.
- Feature branches: `feat/description`, bug fixes: `fix/description`.
- Commit messages: `type: short description` (types: feat, fix, perf, refactor, docs, chore).
- Do not force-push to `main`.
- Do not skip pre-commit hooks (`--no-verify`).
- Agent worktrees must be cleaned up after merging (`git worktree remove --force`).
