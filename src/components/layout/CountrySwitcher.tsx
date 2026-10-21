"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, type KeyboardEvent } from "react";
import { CountryFlag } from "@/components/brand/CountryFlag";
import type { CountryLink } from "@/sanity/pageData";

/**
 * Header location menu. Built on <details>/<summary> so it opens with
 * keyboard and touch before (or without) hydration, and every option is a
 * real link in the server HTML. The script only adds what <details> lacks:
 * close on outside tap, Escape, arrow-key movement, and after navigating.
 *
 * Switching always goes to the other country's main catalogue — there is
 * no "equivalent page" in a different country.
 */
export function CountrySwitcher({
  countries,
  activeSlug,
  placeholder,
  menuLabel,
}: {
  countries: Omit<CountryLink, "image">[];
  activeSlug?: string;
  /** Button text when no country is active (homepage, 404). */
  placeholder: string;
  menuLabel: string;
}) {
  const detailsRef = useRef<HTMLDetailsElement>(null);
  const pathname = usePathname();
  const active = countries.find((country) => country.slug === activeSlug);

  useEffect(() => {
    if (detailsRef.current) detailsRef.current.open = false;
  }, [pathname]);

  useEffect(() => {
    function onPointerDown(event: PointerEvent) {
      const details = detailsRef.current;
      if (details?.open && !details.contains(event.target as Node)) details.open = false;
    }
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, []);

  function onKeyDown(event: KeyboardEvent<HTMLDetailsElement>) {
    const details = detailsRef.current;
    if (!details) return;
    if (event.key === "Escape" && details.open) {
      details.open = false;
      details.querySelector("summary")?.focus();
      return;
    }
    if (event.key !== "ArrowDown" && event.key !== "ArrowUp") return;
    const links = [...details.querySelectorAll<HTMLAnchorElement>("[data-country-option]")];
    if (links.length === 0) return;
    event.preventDefault();
    details.open = true;
    const index = links.indexOf(document.activeElement as HTMLAnchorElement);
    const next = event.key === "ArrowDown" ? (index + 1) % links.length : (index - 1 + links.length) % links.length;
    links[index === -1 && event.key === "ArrowUp" ? links.length - 1 : next].focus();
  }

  return (
    <details ref={detailsRef} className="group relative shrink-0" onKeyDown={onKeyDown}>
      <summary
        aria-label={`${menuLabel}: ${active?.title ?? placeholder}`}
        className="flex min-h-9 cursor-pointer list-none items-center gap-1.5 rounded-md bg-black/40 px-2 py-1 text-[11px] font-medium tracking-[0.14em] text-white uppercase shadow-[0_0_16px_rgba(255,45,138,0.28)] ring-1 ring-[var(--accent)]/70 backdrop-blur-sm transition-colors select-none hover:ring-[var(--accent)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)] sm:px-2.5 [&::-webkit-details-marker]:hidden"
      >
        <CountryFlag slug={active?.slug} className="h-3.5 w-[21px] rounded-[2px] ring-1 ring-white/20" />
        <span className="max-w-[9.5rem] truncate">{active?.title ?? placeholder}</span>
        <svg
          viewBox="0 0 12 12"
          aria-hidden="true"
          className="h-2.5 w-2.5 shrink-0 text-[var(--accent-soft)] transition-transform group-open:rotate-180"
        >
          <path d="M2 4l4 4 4-4" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </summary>
      <nav
        aria-label={menuLabel}
        className="absolute top-full right-0 z-50 mt-2 w-max min-w-[12rem] max-w-[calc(100vw-1.5rem)] overflow-hidden rounded-xl border border-[var(--accent)]/30 bg-[var(--background)]/95 p-1.5 shadow-[0_18px_48px_rgba(0,0,0,0.6),0_0_32px_rgba(255,45,138,0.14)] backdrop-blur-md"
      >
        <ul className="flex flex-col gap-0.5">
          {countries.map((country) => {
            const current = country.slug === activeSlug;
            return (
              <li key={country.slug}>
                <Link
                  href={country.href}
                  hrefLang={country.hrefLang}
                  lang={country.lang}
                  aria-current={current ? (pathname === country.href ? "page" : "true") : undefined}
                  data-country-option
                  className={`flex min-h-11 items-center gap-2.5 rounded-lg px-3 text-[13px] font-medium tracking-[0.08em] transition-colors focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[var(--accent)] ${
                    current
                      ? "bg-[var(--accent)]/15 text-white ring-1 ring-[var(--accent)]/50"
                      : "text-white/85 hover:bg-white/5 hover:text-white"
                  }`}
                >
                  <CountryFlag slug={country.slug} className="h-4 w-6 rounded-[2px] ring-1 ring-white/20" />
                  {country.title}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </details>
  );
}
