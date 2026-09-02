import type { UrlRule } from "sanity";

/**
 * Contact links are the entire business function of this site. They are
 * restricted to known-safe HTTPS hosts so the schema itself cannot be
 * used to store an arbitrary or unsafe URL.
 */
const ALLOWED_HOSTS: Record<"telegram" | "whatsapp" | "telegramChannel", readonly string[]> = {
  telegram: ["t.me"],
  whatsapp: ["wa.me"],
  telegramChannel: ["t.me"],
};

export function validateContactUrl(kind: keyof typeof ALLOWED_HOSTS) {
  return (rule: UrlRule) =>
    rule.custom((value) => {
      if (!value) return true;
      let url: URL;
      try {
        url = new URL(value);
      } catch {
        return "Must be a valid absolute URL.";
      }
      if (url.protocol !== "https:") {
        return "Must use https://.";
      }
      if (!ALLOWED_HOSTS[kind].includes(url.hostname)) {
        return `Host must be one of: ${ALLOWED_HOSTS[kind].join(", ")}.`;
      }
      return true;
    });
}
