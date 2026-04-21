/**
 * Skeleton Loading Component — Botanical Atelier Edition
 * Warm shimmer placeholders
 */

import { cn } from "@/lib/utils"

function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "animate-shimmer",
        className
      )}
      style={{
        background: 'linear-gradient(90deg, var(--ink-800) 25%, var(--ink-700) 50%, var(--ink-800) 75%)',
        backgroundSize: '400% 100%',
      }}
      {...props}
    />
  )
}

export { Skeleton }