/**
 * Button Component — Botanical Atelier Edition
 * Editorial-quality buttons with sharp geometry
 */

import * as React from "react"
import { clsx } from "clsx"
import { cva, type VariantProps } from "class-variance-authority"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium tracking-wide transition-all duration-200 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[var(--gold-400)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--ink-900)] disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "bg-[var(--sage-500)] text-[var(--cream-100)] hover:bg-[var(--sage-400)] active:scale-[0.98]",
        destructive:
          "bg-destructive text-destructive-foreground bg-[#B85C5C] text-[var(--cream-100)] hover:bg-[#a04e4e]",
        outline:
          "border border-input bg-background border-[rgba(216,204,175,0.15)] text-[var(--cream-300)] bg-transparent hover:bg-[rgba(216,204,175,0.04)] hover:text-[var(--cream-100)]",
        secondary:
          "bg-secondary text-secondary-foreground bg-[var(--ink-700)] text-[var(--cream-300)] border border-[rgba(216,204,175,0.08)] hover:bg-[var(--ink-600)]",
        ghost:
          "hover:bg-accent hover:text-accent-foreground text-[var(--cream-400)] hover:bg-[rgba(216,204,175,0.06)] hover:text-[var(--cream-200)]",
        link:
          "text-primary text-[var(--sage-400)] underline-offset-4 hover:underline",
        success:
          "bg-green-600 text-white bg-[var(--sage-500)] text-[var(--cream-100)] hover:bg-[var(--sage-400)]",
        warning:
          "bg-yellow-500 text-white bg-[var(--gold-400)] text-[var(--ink-900)] hover:bg-[var(--gold-300)]",
      },
      size: {
        default: "h-9 px-5 py-2",
        sm: "h-8 px-3 text-xs",
        lg: "h-10 px-8",
        xl: "h-12 px-10 text-base",
        icon: "h-9 w-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
  loading?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, loading, children, disabled, ...props }, ref) => {
    return (
      <button
        className={clsx(buttonVariants({ variant, size }), className)}
        ref={ref}
        disabled={disabled || loading}
        {...props}
      >
        {loading && (
          <svg
            role="img"
            className="animate-spin -ml-1 mr-2 h-4 w-4"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            ></circle>
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
          </svg>
        )}
        {children}
      </button>
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }