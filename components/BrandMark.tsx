/**
 * BrandMark — gold gradient diamond badge.
 * Replaces the 💎 emoji across the app with a crisp, theme-consistent SVG icon.
 */
export default function BrandMark({
  className = "h-8 w-8 text-base",
}: {
  className?: string;
}) {
  return (
    <span
      className={`brand-mark inline-flex flex-shrink-0 items-center justify-center rounded-xl ${className}`}
      aria-hidden="true"
    >
      <i className="ti ti-diamond" />
    </span>
  );
}
