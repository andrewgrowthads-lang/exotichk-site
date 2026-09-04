/**
 * Regional flag of Hong Kong as a local SVG asset (not an OS emoji).
 * Decorative by default — neighbouring text already names the place.
 */
export function HongKongFlag({ className }: { className?: string }) {
  return (
    // Local SVG. The custom next/image loader only accepts cdn.sanity.io.
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/flags/hong-kong.svg"
      alt=""
      width={24}
      height={16}
      className={`inline-block shrink-0 object-cover ${className ?? ""}`}
      draggable={false}
    />
  );
}
