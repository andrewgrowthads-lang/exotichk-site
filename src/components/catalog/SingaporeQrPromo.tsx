import Image from "next/image";

const COUNTRY_QR = {
  "hong-kong": {
    title: "Hong Kong",
    handle: "@EXOTICHK",
    href: "https://t.me/EXOTICHK",
    image: "/qr/hong-kong-telegram.webp",
  },
  singapore: {
    title: "Singapore",
    handle: "@SPLUSSG",
    href: "https://t.me/SPLUSSG",
    image: "/qr/singapore-telegram.webp",
  },
} as const;

export function CountryTelegramQrPromo({ countrySlug }: { countrySlug: string }) {
  const promo = COUNTRY_QR[countrySlug as keyof typeof COUNTRY_QR];
  if (!promo) return null;

  return (
    <a
      href={promo.href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`Open all ${promo.title} profiles on Telegram`}
      className="group flex items-center gap-2.5 rounded-2xl border border-white/15 bg-black/40 p-1.5 pr-3 shadow-[0_10px_35px_rgba(0,0,0,0.4),0_0_26px_rgba(255,45,138,0.16)] backdrop-blur-md transition duration-200 hover:-translate-y-0.5 hover:border-[var(--accent)]/55 hover:bg-black/55 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)] sm:gap-3 sm:p-2 sm:pr-4"
    >
      <Image
        src={promo.image}
        width={460}
        height={490}
        sizes="(min-width: 640px) 112px, 92px"
        alt={`Telegram QR code for ${promo.title}`}
        unoptimized
        className="h-auto w-[92px] shrink-0 rounded-[13px] ring-1 ring-white/15 sm:w-28 sm:rounded-2xl"
      />
      <span className="min-w-0">
        <span className="block text-[10px] font-semibold tracking-[0.16em] text-white uppercase [text-shadow:0_1px_10px_rgba(0,0,0,0.75)] sm:text-[11px]">
          All girls there
        </span>
        <span className="mt-1 block text-[10px] font-medium tracking-[0.08em] text-[var(--accent-soft)] sm:text-[11px]">
          {promo.handle}
        </span>
      </span>
    </a>
  );
}
