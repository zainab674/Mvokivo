import * as React from "react"
import { cn } from "@/lib/utils"
import { cva, type VariantProps } from "class-variance-authority"

const glassCardVariants = cva(
  "robotics-card text-foreground transition-all duration-300",
  {
    variants: {
      variant: {
        default: "",
        premium: "neon-border shadow-[0_0_20px_rgba(0,243,255,0.2)]",
        enterprise: "border-primary/50 shadow-[0_0_30px_rgba(0,243,255,0.3)]",
        light: "bg-secondary/20",
        ultra: "bg-primary/10 border-primary"
      },
      size: {
        sm: "p-4",
        md: "p-6",
        lg: "p-8",
        xl: "p-10"
      }
    },
    defaultVariants: {
      variant: "default",
      size: "md"
    }
  }
)

export interface GlassCardProps
  extends React.HTMLAttributes<HTMLDivElement>,
  VariantProps<typeof glassCardVariants> {
  hover?: boolean
}

const GlassCard = React.forwardRef<HTMLDivElement, GlassCardProps>(
  ({ className, variant, size, hover = false, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          glassCardVariants({ variant, size }),
          hover && "hover:scale-105 hover:shadow-2xl hover:shadow-white/5",
          className
        )}
        {...props}
      />
    )
  }
)
GlassCard.displayName = "GlassCard"

export { GlassCard, glassCardVariants }