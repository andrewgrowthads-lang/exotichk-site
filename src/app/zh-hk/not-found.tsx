import Link from "next/link";
import { getDictionary } from "@/i18n/dictionaries";
import { homePath } from "@/lib/urls";
import { PageShell } from "@/components/layout/PageShell";

const LOCALE = "zh-Hant-HK" as const;

export default function NotFound() {
  const dictionary = getDictionary(LOCALE);
  return (
    <PageShell locale={LOCALE} dictionary={dictionary}>
      <div className="flex flex-col items-center py-16 text-center">
        <h1 className="text-2xl font-semibold text-neutral-900 dark:text-neutral-50">{dictionary.notFound.title}</h1>
        <p className="mt-2 text-neutral-600 dark:text-neutral-400">{dictionary.notFound.description}</p>
        <Link href={homePath(LOCALE)} className="mt-6 text-sm font-medium text-sky-600 hover:underline">
          {dictionary.notFound.backHome}
        </Link>
      </div>
    </PageShell>
  );
}
