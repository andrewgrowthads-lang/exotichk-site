/** Short English summary for visibility/SEO when the editor only wrote a description. */
export function deriveSummaryEn(description: string | undefined, displayName: string | undefined): string {
  const body = description?.trim().replace(/\s+/g, " ") ?? "";
  if (body) {
    const sentence = body.split(/(?<=[.!?])\s+/)[0] ?? body;
    return sentence.slice(0, 160).trim();
  }
  const name = displayName?.trim() ?? "";
  return name || "Profile";
}
