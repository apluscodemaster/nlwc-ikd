import { forwardRef } from "react";
import type { LucideIcon, LucideProps } from "lucide-react";

/**
 * Praying (folded) hands, drawn in lucide's style (24×24, round caps/joins)
 * because lucide has no such icon. Same drawing as the mobile app's
 * mobile/src/components/icons-custom.tsx. Accepts lucide props (className,
 * size, color, strokeWidth), so it's used like any lucide icon.
 */
const PrayingHandsIcon = forwardRef<SVGSVGElement, LucideProps>(function PrayingHandsIcon(
  { size = 24, color = "currentColor", strokeWidth = 2, className, ...rest },
  ref,
) {
  return (
    <svg
      ref={ref}
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
      {...rest}
    >
      <path d="M12 2.5V14" />
      <path d="M12 2.5c1.9 1.2 3 3.4 3 5.8V10l2.4 2.4a2 2 0 0 1 .3 2.5L16 17.5" />
      <path d="M12 2.5c-1.9 1.2-3 3.4-3 5.8V10l-2.4 2.4a2 2 0 0 0-.3 2.5L8 17.5" />
      <path d="M16 17.5l1.5 3.5" />
      <path d="M8 17.5l-1.5 3.5" />
      <path d="M12 14l2 7" />
      <path d="M12 14l-2 7" />
    </svg>
  );
});

export default PrayingHandsIcon as unknown as LucideIcon;
