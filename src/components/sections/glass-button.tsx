import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const glassButtonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap text-sm font-medium transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "btn-robotics",
        primary: "btn-robotics shadow-[0_0_15px_hsl(var(--primary)/0.5)]",
        secondary: "border border-primary/30 hover:bg-primary/10 text-primary hover:text-primary-foreground",
        premium: "bg-primary/20 text-primary border border-primary hover:bg-primary/40 hover:shadow-[0_0_20px_hsl(var(--primary)/0.6)]",
        enterprise: "bg-transparent border border-white/20 text-white hover:bg-white/10 hover:border-white/40",
        ghost: "hover:bg-primary/10 hover:text-primary",
        outline: "border border-primary/50 text-primary hover:bg-primary/10"
      },
      size: {
        sm: "h-9 px-3 text-xs",
        md: "h-10 px-4 py-2",
        lg: "h-11 px-8",
        xl: "h-12 px-10 text-base",
        icon: "h-10 w-10"
      }
    },
    defaultVariants: {
      variant: "default",
      size: "md"
    }
  }
)

export interface GlassButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
  VariantProps<typeof glassButtonVariants> {
  asChild?: boolean
}

const GlassButton = React.forwardRef<HTMLButtonElement, GlassButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(glassButtonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
GlassButton.displayName = "GlassButton"

export { GlassButton, glassButtonVariants }