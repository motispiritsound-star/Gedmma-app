"use client";

import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { createTranslator, type AppLocale } from "@/modules/i18n";
import type { QuestDetail } from "@/modules/quests/types";

type Phase = "countdown" | "putAway" | "steps";

const COUNTDOWN_SECONDS = 10;

/** Never re-subscribes: capability detection does not change during a session. */
const noopSubscribe = () => () => {};

function useSpeech(locale: string) {
  const [speaking, setSpeaking] = useState(false);

  // Read once from the browser rather than setting state in an effect, so the
  // first client render already knows whether to offer the read-aloud button.
  const supported = useSyncExternalStore(
    noopSubscribe,
    () => "speechSynthesis" in window,
    () => false,
  );

  useEffect(
    () => () => {
      if (typeof window !== "undefined" && "speechSynthesis" in window) window.speechSynthesis.cancel();
    },
    [],
  );

  const speak = useCallback(
    (text: string) => {
      if (!supported) return;
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = locale === "en" ? "en-GB" : "nl-NL";
      utterance.rate = 0.95;
      utterance.onend = () => setSpeaking(false);
      utterance.onerror = () => setSpeaking(false);
      setSpeaking(true);
      window.speechSynthesis.speak(utterance);
    },
    [locale, supported],
  );

  const stop = useCallback(() => {
    if (!supported) return;
    window.speechSynthesis.cancel();
    setSpeaking(false);
  }, [supported]);

  return { supported, speaking, speak, stop };
}

/**
 * Adventure Mode.
 *
 * Design rules that are deliberate, not accidental:
 *  - nothing here requires continuous interaction, and no timer punishes you for
 *    leaving; the device is meant to be put down and allowed to sleep;
 *  - the whole quest is written into localStorage on mount, so the steps stay
 *    readable when the family walks out of signal;
 *  - the timer is optional and never blocks finishing.
 */
export function AdventureClient({
  quest,
  completionId,
  locale,
  startedAtIso,
}: {
  quest: QuestDetail;
  completionId: string;
  locale: AppLocale;
  startedAtIso: string;
}) {
  // The translator is a function, which cannot cross the server/client
  // boundary; the locale can, so the dictionary is bound here instead.
  const t = useMemo(() => createTranslator(locale), [locale]);
  const [phase, setPhase] = useState<Phase>("countdown");
  const [remaining, setRemaining] = useState(COUNTDOWN_SECONDS);
  const cacheable = useSyncExternalStore(
    noopSubscribe,
    () => {
      try {
        return typeof window.localStorage !== "undefined";
      } catch {
        return false;
      }
    },
    () => false,
  );
  const [stepIndex, setStepIndex] = useState(0);
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [timerRunning, setTimerRunning] = useState(false);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const { supported, speaking, speak, stop } = useSpeech(locale);

  const storageKey = `questly:adventure:${completionId}`;

  useEffect(() => {
    try {
      window.localStorage.setItem(
        storageKey,
        JSON.stringify({ quest, startedAtIso, savedAt: new Date().toISOString() }),
      );
    } catch {
      // Private browsing or a full quota: caching is a convenience, not a
      // requirement, so a failure here changes nothing the family can see.
    }
  }, [quest, startedAtIso, storageKey]);

  useEffect(() => {
    if (phase !== "countdown" || remaining <= 0) return;
    const handle = window.setTimeout(() => setRemaining((value) => Math.max(0, value - 1)), 1000);
    return () => window.clearTimeout(handle);
  }, [phase, remaining]);

  useEffect(() => {
    if (!timerRunning) return;
    const handle = window.setInterval(() => setTimerSeconds((value) => value + 1), 1000);
    return () => window.clearInterval(handle);
  }, [timerRunning]);

  useEffect(() => {
    if (phase === "steps") headingRef.current?.focus();
  }, [phase, stepIndex]);

  // The countdown rolls into the "put it away" screen by derivation rather than
  // by a state update inside the timer effect.
  const showCountdown = phase === "countdown" && remaining > 0;
  const showPutAway = phase === "putAway" || (phase === "countdown" && remaining === 0);
  const step = quest.steps[stepIndex];
  const minutes = String(Math.floor(timerSeconds / 60)).padStart(2, "0");
  const seconds = String(timerSeconds % 60).padStart(2, "0");

  return (
    <div className="q-adventure">
      <div className="q-container flex min-h-dvh flex-col py-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="q-badge bg-white/15 text-[#fdf8ee]">{t("adventure.title")}</p>
          <Link href={`/quests/${quest.slug}`} className="q-btn q-btn--ghost text-[#fdf8ee]">
            {t("common.back")}
          </Link>
        </div>

        <h1 className="mt-4 text-3xl sm:text-4xl">{quest.title}</h1>

        {showCountdown ? (
          <section className="mt-10 flex flex-1 flex-col items-center justify-center text-center">
            <h2 className="text-2xl">{t("adventure.prepare")}</h2>
            <p aria-live="polite" className="mt-4 font-display text-7xl tabular-nums">
              {remaining}
            </p>
            <p className="mt-3 max-w-md text-lg">{t("adventure.countdown", { seconds: remaining })}</p>
            <ul className="mt-6 max-w-md space-y-1.5 text-left">
              {quest.preparation.map((item) => (
                <li key={item} className="flex gap-2">
                  <span aria-hidden="true">☐</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
            <button type="button" className="q-btn q-btn--accent mt-8" onClick={() => setPhase("putAway")}>
              {t("common.next")}
            </button>
          </section>
        ) : null}

        {showPutAway ? (
          <section className="mt-10 flex flex-1 flex-col items-center justify-center text-center">
            <p className="text-6xl" aria-hidden="true">
              📵
            </p>
            <h2 className="mt-4 max-w-xl text-3xl">{t("adventure.putAway")}</h2>
            <p className="mt-3 max-w-xl text-lg">{t("adventure.putAwayHint")}</p>
            <p className="mt-2 max-w-xl text-sm opacity-80">{t("adventure.honest")}</p>
            {cacheable ? (
              <p className="mt-4 text-sm opacity-80">
                {t("adventure.offlineReady")} {t("adventure.offlineHint")}
              </p>
            ) : null}
            <button type="button" className="q-btn q-btn--accent mt-8" onClick={() => setPhase("steps")}>
              {t("adventure.next")}
            </button>
          </section>
        ) : null}

        {phase === "steps" && step ? (
          <section className="mt-8 flex flex-1 flex-col justify-center">
            <div className="q-card p-6">
              <p className="q-badge bg-white/15 text-[#fdf8ee]">
                {t("adventure.stepOf", { current: stepIndex + 1, total: quest.steps.length })}
              </p>
              <h2 ref={headingRef} tabIndex={-1} className="mt-3 text-2xl sm:text-3xl">
                {step.title}
              </h2>
              <p className="mt-4 whitespace-pre-line text-lg leading-relaxed">{step.body}</p>
              {step.tip ? <p className="mt-4 opacity-85">💡 {step.tip}</p> : null}

              {supported ? (
                <button
                  type="button"
                  className="q-btn q-btn--secondary mt-6"
                  onClick={() => (speaking ? stop() : speak(`${step.title}. ${step.body}`))}
                >
                  <span aria-hidden="true">🔊</span>
                  {speaking ? t("quest.stopListening") : t("quest.listen")}
                </button>
              ) : null}
            </div>

            <div className="mt-5 flex flex-wrap items-center gap-3">
              <button
                type="button"
                className="q-btn q-btn--secondary"
                onClick={() => setStepIndex((index) => Math.max(0, index - 1))}
                disabled={stepIndex === 0}
              >
                ← {t("adventure.previous")}
              </button>
              <button
                type="button"
                className="q-btn q-btn--secondary"
                onClick={() => setStepIndex((index) => Math.min(quest.steps.length - 1, index + 1))}
                disabled={stepIndex >= quest.steps.length - 1}
              >
                {t("adventure.next")} →
              </button>

              <div className="ml-auto flex items-center gap-3">
                <p aria-live="off" className="font-display text-xl tabular-nums">
                  <span className="q-visually-hidden">{t("adventure.timer")}: </span>
                  {minutes}:{seconds}
                </p>
                <button type="button" className="q-btn q-btn--ghost text-[#fdf8ee]" onClick={() => setTimerRunning((v) => !v)}>
                  {timerRunning ? t("adventure.timerStop") : t("adventure.timerStart")}
                </button>
              </div>
            </div>

            <Link href={`/complete/${completionId}?minutes=${Math.round(timerSeconds / 60)}`} className="q-btn q-btn--accent mt-8 w-full sm:w-auto">
              {t("adventure.finish")}
            </Link>
          </section>
        ) : null}
      </div>
    </div>
  );
}
