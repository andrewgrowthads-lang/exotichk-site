import Link from "next/link";

export interface Breadcrumb {
  label: string;
  href: string;
}

export function Breadcrumbs({ items }: { items: Breadcrumb[] }) {
  return (
    <nav aria-label="Breadcrumb" className="mb-4 text-[12px] text-[var(--muted)]">
      <ol className="flex flex-wrap items-center gap-1.5">
        {items.map((item, index) => (
          <li key={item.href} className="flex items-center gap-1.5">
            {index > 0 && <span aria-hidden="true" className="text-[var(--line)]">/</span>}
            {index === items.length - 1 ? (
              <span aria-current="page" className="text-[var(--foreground)]">
                {item.label}
              </span>
            ) : (
              <Link href={item.href} className="text-[var(--accent-soft)] underline-offset-2 hover:underline">
                {item.label}
              </Link>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
