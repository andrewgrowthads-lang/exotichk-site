import { track } from "@vercel/analytics";
import type { LocaleId } from "@/i18n/config";

/**
 * The catalog's event model. Three names, deliberately stable:
 *
 * - `profile_view`  — one per profile page shown to a visitor.
 * - `contact_click` — the WhatsApp / Telegram CTA. `method` distinguishes
 *                     the two; they are **not** split into
 *                     `whatsapp_click` / `telegram_click` because renaming
 *                     an event in Vercel Web Analytics starts its history
 *                     over, and `contact_click` is already collecting.
 *                     Filter on `method` instead.
 * - `channel_click` — the secondary Telegram channel link.
 *
 * All three carry the same `ProfileContext`, so `profile_view` is a usable
 * denominator for the click events at profile, district, country and
 * locale granularity, plus the visitor's UTM parameters (see `readUtm`).
 */

export type ContactMethod = "telegram" | "whatsapp" | "telegramChannel";

export interface ProfileContext {
  /** Sanity `_id`. Stable across a display-name change, unlike the slug. */
  profileId: string;
  /** URL slug — matches the `/profiles/{slug}/` path segment. */
  profile: string;
  /** Public display name, so reports are readable without joining on the id. */
  profileName: string;
  country: string;
  district: string;
  locale: LocaleId;
}

const UTM_KEYS = ["utm_source", "utm_medium", "utm_campaign", "utm_content"] as const;
const UTM_STORAGE_KEY = "exotichk:utm";
/** Vercel rejects oversized property values; campaign names are never legitimately this long. */
const MAX_UTM_LENGTH = 255;

function utmFromLocation(): Record<string, string> {
  const params = new URLSearchParams(window.location.search);
  const found: Record<string, string> = {};
  for (const key of UTM_KEYS) {
    const value = params.get(key);
    if (value) found[key] = value.slice(0, MAX_UTM_LENGTH);
  }
  return found;
}

function utmFromStorage(): Record<string, string> {
  const stored = window.sessionStorage.getItem(UTM_STORAGE_KEY);
  if (!stored) return {};
  const parsed: unknown = JSON.parse(stored);
  if (!parsed || typeof parsed !== "object") return {};
  const restored: Record<string, string> = {};
  for (const key of UTM_KEYS) {
    const value = (parsed as Record<string, unknown>)[key];
    if (typeof value === "string" && value) restored[key] = value;
  }
  return restored;
}

/**
 * UTM parameters exist only on the *landing* URL. A visitor who arrives on
 * a campaign link and then taps through to a profile would otherwise
 * produce a completely unattributed conversion — which is the one question
 * this instrumentation exists to answer. So the parameters are mirrored
 * into `sessionStorage` and replayed onto every later event in the session.
 *
 * Last touch wins: a fresh campaign link mid-session overwrites the stored
 * set, matching how Vercel attributes its own pageviews. Storage can be
 * unavailable (Safari private mode, blocked cookies) or hold junk — every
 * failure degrades to "no UTM on this event", never to a thrown error.
 */
function readUtm(): Record<string, string> {
  if (typeof window === "undefined") return {};
  try {
    const fromLocation = utmFromLocation();
    if (Object.keys(fromLocation).length > 0) {
      try {
        window.sessionStorage.setItem(UTM_STORAGE_KEY, JSON.stringify(fromLocation));
      } catch {
        // Storage unavailable — the event still gets this page's own UTM.
      }
      return fromLocation;
    }
    return utmFromStorage();
  } catch {
    return {};
  }
}

/**
 * Every event goes through here. `track` is already best-effort (it is a
 * no-op until the analytics script has loaded), but the extra guard makes
 * the contract explicit and unconditional: this function is only ever
 * called from an `onClick` on a real `<a href>` that navigates on its own,
 * or from an effect, and it must never be the thing that throws on the way
 * to WhatsApp or Telegram.
 */
function emit(name: string, properties: Record<string, string>): void {
  try {
    track(name, { ...properties, ...readUtm() });
  } catch {
    // Analytics is never allowed to break navigation or rendering.
  }
}

export function trackProfileView(context: ProfileContext): void {
  emit("profile_view", { ...context });
}

export function trackContactClick(payload: ProfileContext & { method: ContactMethod }): void {
  emit("contact_click", { ...payload });
}

export function trackChannelClick(context: ProfileContext): void {
  emit("channel_click", { ...context, method: "telegramChannel" satisfies ContactMethod });
}
