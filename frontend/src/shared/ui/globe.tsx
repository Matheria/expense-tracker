/**
 * Faint wireframe globe — the recurring decorative motif from the design,
 * etched into the balance hero and the dark tip card. Purely ornamental.
 */
export function Globe({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 200 200"
      fill="none"
      className={className}
      aria-hidden="true"
      preserveAspectRatio="xMidYMid slice"
    >
      <defs>
        <clipPath id="globe-clip">
          <circle cx="100" cy="100" r="99" />
        </clipPath>
      </defs>
      <g
        clipPath="url(#globe-clip)"
        stroke="currentColor"
        strokeWidth="0.75"
        vectorEffect="non-scaling-stroke"
      >
        <circle cx="100" cy="100" r="99" />
        {/* meridians */}
        <ellipse cx="100" cy="100" rx="99" ry="99" />
        <ellipse cx="100" cy="100" rx="66" ry="99" />
        <ellipse cx="100" cy="100" rx="33" ry="99" />
        <line x1="100" y1="1" x2="100" y2="199" />
        {/* parallels */}
        <line x1="1" y1="40" x2="199" y2="40" />
        <line x1="1" y1="70" x2="199" y2="70" />
        <line x1="1" y1="100" x2="199" y2="100" />
        <line x1="1" y1="130" x2="199" y2="130" />
        <line x1="1" y1="160" x2="199" y2="160" />
      </g>
    </svg>
  );
}
