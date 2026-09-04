import Link from "next/link";
import type { Metadata } from "next";
import { getDictionary } from "@/i18n/dictionaries";
import { homePath } from "@/lib/urls";
import { PageShell } from "@/components/layout/PageShell";

const LOCALE = "zh-Hant-HK" as const;

export const metadata: Metadata = {
  title: "找不到頁面｜ExoticHK",
  robots: { index: false, follow: false },
};

export default function NotFound() {
  const dictionary = getDictionary(LOCALE);
  return (
    <PageShell locale={LOCALE} dictionary={dictionary}>
      <div className="flex flex-col items-center py-16 text-center">
        <h1 className="text-[22px] font-medium tracking-tight text-[var(--foreground)]">{dictionary.notFound.title}</h1>
        <p className="mt-2 text-[14px] text-[var(--muted)]">{dictionary.notFound.description}</p>
        <Link href={homePath(LOCALE)} className="mt-6 text-[14px] font-medium underline-offset-2 hover:underline">
          {dictionary.notFound.backHome}
        </Link>
      </div>
    </PageShell>
  );
}
