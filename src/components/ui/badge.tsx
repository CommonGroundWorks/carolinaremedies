/**
 * Badge Component — Botanical Atelier Edition
 * Specimen labels with editorial precision
 */

import * as React from "react"
import { clsx } from "clsx"
import { cva, type VariantProps } from "class-variance-authority"

const badgeVariants = cva(
  "inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold tracking-wider uppercase transition-colors",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary text-primary-foreground bg-[var(--sage-500)] text-[var(--cream-100)]",
        secondary:
          "border-[rgba(216,204,175,0.12)] bg-secondary text-secondary-foreground hover:bg-secondary/80 bg-[var(--ink-700)] text-[var(--cream-300)]",
        destructive:
          "border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80 bg-[#B85C5C] text-[var(--cream-100)]",
        outline:
          "border-[rgba(216,204,175,0.15)] text-foreground text-[var(--cream-300)] bg-transparent",
        success:
          "border-green-200 bg-green-100 text-green-800 hover:bg-green-200 border-transparent bg-[rgba(80,142,68,0.15)] text-[var(--sage-400)]",
        warning:
          "border-yellow-200 bg-yellow-100 text-yellow-800 hover:bg-yellow-200 border-transparent bg-[rgba(201,168,76,0.15)] text-[var(--gold-400)]",
        info:
          "border-blue-200 bg-blue-100 text-blue-800 hover:bg-blue-200 border-transparent bg-[rgba(92,133,184,0.15)] text-[#7BA3D0]",
        thc:
          "border-red-200 bg-red-100 text-red-800 hover:bg-red-200",
        cbd:
          "border-green-200 bg-green-100 text-green-800 hover:bg-green-200",
        indica:
          "border-purple-200 bg-purple-100 text-purple-800 hover:bg-purple-200",
        sativa:
          "border-orange-200 bg-orange-100 text-orange-800 hover:bg-orange-200",
        hybrid:
          "border-indigo-200 bg-indigo-100 text-indigo-800 hover:bg-indigo-200",
        featured:
          "border-transparent bg-[var(--gold-400)] text-[var(--ink-900)]",
        new:
          "border-transparent bg-[var(--gold-400)] text-[var(--ink-900)]",
        bestseller:
          "border-transparent bg-[rgba(80,142,68,0.9)] text-[var(--cream-100)]",
        strain:
          "border-[rgba(216,204,175,0.12)] bg-[var(--ink-700)] text-[var(--cream-400)]",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={clsx(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }