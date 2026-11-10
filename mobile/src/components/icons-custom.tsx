/**
 * Custom icons drawn in lucide's style (24×24 grid, round caps/joins, house
 * stroke width) for symbols lucide doesn't ship. Re-exported from the
 * generated icons.ts, so they're used exactly like lucide icons.
 */
import Svg, { Path } from "react-native-svg";
import type { LucideIcon, LucideProps } from "lucide-react-native";

const STROKE = 1.5; // keep in step with ICON_STROKE in icons.ts

/** Praying (folded) hands: palms together, fingers up, forearms below. */
function PrayingHandsIcon({ size = 24, color = "currentColor", strokeWidth = STROKE, ...rest }: LucideProps) {
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      {...rest}
    >
      {/* Palms meeting along the centre line */}
      <Path d="M12 2.5V14" />
      {/* Right hand: fingers, heel of the palm, wrist */}
      <Path d="M12 2.5c1.9 1.2 3 3.4 3 5.8V10l2.4 2.4a2 2 0 0 1 .3 2.5L16 17.5" />
      {/* Left hand (mirror) */}
      <Path d="M12 2.5c-1.9 1.2-3 3.4-3 5.8V10l-2.4 2.4a2 2 0 0 0-.3 2.5L8 17.5" />
      {/* Forearms: outer edges continue down from the wrists, inner edges
          part from where the palms meet */}
      <Path d="M16 17.5l1.5 3.5" />
      <Path d="M8 17.5l-1.5 3.5" />
      <Path d="M12 14l2 7" />
      <Path d="M12 14l-2 7" />
    </Svg>
  );
}

export const PrayingHands = PrayingHandsIcon as unknown as LucideIcon;
