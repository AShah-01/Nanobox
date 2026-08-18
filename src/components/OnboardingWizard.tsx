import { useState } from "react";
import { THEMES } from "../themes/themes";
import { setTheme } from "../core/themeStore";
import { createWidgetInstance } from "../storage/widgetInstances";
import { DEFAULT_SIZE, WIDGET_LABELS, WidgetId } from "../widgets/registry";
import { getSetting, setSetting } from "../storage/settings";
import type { ThemeId } from "../themes/themes";
import "./OnboardingWizard.css";

const ONBOARDING_KEY = "onboardingComplete";
const ACCENT_PRESETS = ["#7c9cff", "#ff8a7c", "#7cffb0", "#ffd27c", "#c77cff", "#7cf0ff"];
const FIRST_WIDGET_CHOICES: WidgetId[] = ["clock", "notes", "focus-mode", "calendar", "habit-tracker", "music"];

type Step = "welcome" | "theme" | "accent" | "widget" | "done";
const STEP_ORDER: Step[] = ["welcome", "theme", "accent", "widget", "done"];

export async function hasCompletedOnboarding(): Promise<boolean> {
  try {
    return (await getSetting(ONBOARDING_KEY)) === "true";
  } catch {
    return true; // fail open — never trap a user in the wizard because of a DB error
  }
}

interface OnboardingWizardProps {
  onComplete: () => void;
}

export function OnboardingWizard({ onComplete }: OnboardingWizardProps) {
  const [step, setStep] = useState<Step>("welcome");
  const [chosenTheme, setChosenTheme] = useState<ThemeId>("matte");
  const [accent, setAccent] = useState(ACCENT_PRESETS[0]);
  const [chosenWidget, setChosenWidget] = useState<WidgetId>("clock");
  const [finishing, setFinishing] = useState(false);

  const stepIndex = STEP_ORDER.indexOf(step);

  function goNext() {
    const next = STEP_ORDER[stepIndex + 1];
    if (next) setStep(next);
  }

  function goBack() {
    const prev = STEP_ORDER[stepIndex - 1];
    if (prev) setStep(prev);
  }

  async function finish() {
    setFinishing(true);
    try {
      setTheme(chosenTheme);
      localStorage.setItem("settings:accentColor", accent);
      document.documentElement.style.setProperty("--nb-accent", accent);
      await createWidgetInstance({ widget_type: chosenWidget, x: 24, y: 24, ...DEFAULT_SIZE[chosenWidget] });
      await setSetting(ONBOARDING_KEY, "true");
    } catch (err) {
      console.error("onboarding finish failed", err);
    } finally {
      setFinishing(false);
      onComplete();
    }
  }

  async function skip() {
    try {
      await setSetting(ONBOARDING_KEY, "true");
    } catch (err) {
      console.error("failed to persist onboarding skip", err);
    }
    onComplete();
  }

  return (
    <div className="onboarding__overlay" role="dialog" aria-modal="true" aria-label="Welcome to Nanobox">
      <div className="onboarding">
        <div className="onboarding__progress">
          {STEP_ORDER.slice(0, -1).map((s, i) => (
            <span key={s} className={`onboarding__dot ${i <= stepIndex ? "is-active" : ""}`} />
          ))}
        </div>

        {step === "welcome" && (
          <div className="onboarding__step">
            <h1 className="onboarding__title">Welcome to Nanobox 🧠✨</h1>
            <p className="onboarding__body">
              A customisable desktop companion — notes, focus tools, calendar and more, all in one calm, themeable
              space. Let's set a few things up.
            </p>
            <div className="onboarding__actions">
              <button className="onboarding__btn onboarding__btn--ghost" onClick={skip}>
                Skip setup
              </button>
              <button className="onboarding__btn onboarding__btn--primary" onClick={goNext}>
                Get started
              </button>
            </div>
          </div>
        )}

        {step === "theme" && (
          <div className="onboarding__step">
            <h2 className="onboarding__title">Pick a theme</h2>
            <p className="onboarding__body">You can change this any time from Settings.</p>
            <div className="onboarding__grid">
              {THEMES.map((t) => (
                <button
                  key={t.id}
                  className={`onboarding__option ${chosenTheme === t.id ? "is-active" : ""}`}
                  onClick={() => setChosenTheme(t.id)}
                >
                  <span className="onboarding__option-label">{t.label}</span>
                  <span className="onboarding__option-desc">{t.description}</span>
                </button>
              ))}
            </div>
            <div className="onboarding__actions">
              <button className="onboarding__btn onboarding__btn--ghost" onClick={goBack}>
                Back
              </button>
              <button className="onboarding__btn onboarding__btn--primary" onClick={goNext}>
                Next
              </button>
            </div>
          </div>
        )}

        {step === "accent" && (
          <div className="onboarding__step">
            <h2 className="onboarding__title">Choose an accent colour</h2>
            <p className="onboarding__body">Used for buttons, highlights, and active states.</p>
            <div className="onboarding__swatches">
              {ACCENT_PRESETS.map((c) => (
                <button
                  key={c}
                  className={`onboarding__swatch ${accent === c ? "is-active" : ""}`}
                  style={{ background: c }}
                  onClick={() => setAccent(c)}
                  aria-label={`Accent colour ${c}`}
                />
              ))}
              <input
                type="color"
                className="onboarding__swatch-custom"
                value={accent}
                onChange={(e) => setAccent(e.target.value)}
                aria-label="Custom accent colour"
              />
            </div>
            <div className="onboarding__actions">
              <button className="onboarding__btn onboarding__btn--ghost" onClick={goBack}>
                Back
              </button>
              <button className="onboarding__btn onboarding__btn--primary" onClick={goNext}>
                Next
              </button>
            </div>
          </div>
        )}

        {step === "widget" && (
          <div className="onboarding__step">
            <h2 className="onboarding__title">Add your first widget</h2>
            <p className="onboarding__body">You can add more from the "+ Add widget" button any time.</p>
            <div className="onboarding__grid">
              {FIRST_WIDGET_CHOICES.map((id) => (
                <button
                  key={id}
                  className={`onboarding__option ${chosenWidget === id ? "is-active" : ""}`}
                  onClick={() => setChosenWidget(id)}
                >
                  <span className="onboarding__option-label">{WIDGET_LABELS[id]}</span>
                </button>
              ))}
            </div>
            <div className="onboarding__actions">
              <button className="onboarding__btn onboarding__btn--ghost" onClick={goBack}>
                Back
              </button>
              <button className="onboarding__btn onboarding__btn--primary" onClick={finish} disabled={finishing}>
                {finishing ? "Setting up…" : "Finish"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
