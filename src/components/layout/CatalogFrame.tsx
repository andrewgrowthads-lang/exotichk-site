import type { ReactNode } from "react";

/**
 * Shared content width for header, catalogue, profile, and footer.
 * Wide enough for four portrait cards on a normal desktop, without a
 * tiny column floating in the viewport.
 */
export function CatalogFrame({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`mx-auto w-full max-w-[1440px] px-3 sm:px-5 lg:px-6 ${className ?? ""}`}>
      {children}
    </div>
  );
}
