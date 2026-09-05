import Link from "next/link";
import type { Metadata } from "next";
import { getDictionary } from "@/i18n/dictionaries";
import { homePath } from "@/lib/urls";
import { CatalogFrame } from "@/components/layout/CatalogFrame";
import { PageShell } from "@/components/layout/PageShell";

const LOCALE = "en" as const;

export const metadata: Metadata = {
  title: "Page not found | ExoticHK",
  robots: { index: false, follow: false },
};

export default function NotFound() {
  const dictionary = getDictionary(LOCALE);
  return (
    <PageShell locale={LOCALE} dictionary={dictionary}>
      <CatalogFrame>
        <div className="mt-8 flex flex-col items-center rounded-2xl border border-[var(--accent)]/18 bg-black/40 px-6 py-16 text-center shadow-[0_0_40px_rgba(255,45,138,0.08)] backdrop-blur-md">
          <h1 className="text-[22px] font-medium tracking-tight text-white">{dictionary.notFound.title}</h1>
          <p className="mt-2 text-[14px] text-[var(--muted)]">{dictionary.notFound.description}</p>
          <Link
            href={homePath(LOCALE)}
            className="mt-6 rounded-md bg-[var(--accent)] px-5 py-2.5 text-[13px] font-medium tracking-[0.12em] text-white uppercase"
          >
            {dictionary.notFound.backHome}
          </Link>
        </div>
      </CatalogFrame>
    </PageShell>
  );
}
