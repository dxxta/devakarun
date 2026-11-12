import type { SVGProps } from 'react'

export function Wordmark(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      aria-hidden="true"
      fill="currentColor"
      height="88"
      viewBox="0 0 460 88"
      width="460"
      {...props}
    >
      <text
        x="4"
        y="68"
        fontFamily="var(--font-display)"
        fontSize="72"
        fontWeight="800"
        letterSpacing="-3"
      >
        <tspan>dev</tspan>
        <tspan fill="var(--primary)">.</tspan>
        <tspan>akarun</tspan>
      </text>
    </svg>
  )
}
