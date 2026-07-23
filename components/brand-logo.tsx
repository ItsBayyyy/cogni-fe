import Image from "next/image"

/**
 * CogniFlip brand mark — a softly glowing gradient orb (coral / pink / peach /
 * lavender / mint) baked into a cream squircle that matches the app's
 * --background. Used as the header badge, mobile drawer mark, and favicon.
 *
 * The image already contains the rounded silhouette, so we render it on a
 * transparent wrapper (no dark `bg-foreground` square — that would clip the
 * shape and dull the gradient). The wrapper just sets the size and adds a
 * subtle drop shadow that picks up the warm palette.
 */
export function BrandLogo({
  size = 32,
  className = "",
  priority = false,
}: {
  size?: number
  className?: string
  priority?: boolean
}) {
  return (
    <span
      className={`relative inline-block shrink-0 rounded-[10px] overflow-hidden ${className}`}
      style={{ width: size, height: size }}
      aria-hidden
    >
      <Image
        src="/cogniflip-logo.jpg"
        alt=""
        fill
        sizes={`${size}px`}
        priority={priority}
        className="object-cover"
      />
    </span>
  )
}
