import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 rounded-xl text-sm font-bold transition-all disabled:pointer-events-none disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400/50 active:scale-[0.99]",
  {
    variants: {
      variant: {
        default: "bg-zinc-950 text-white shadow-[0_12px_24px_rgba(24,24,27,0.18)] hover:bg-zinc-800",
        secondary: "border border-zinc-200 bg-white text-zinc-950 shadow-sm hover:bg-zinc-50",
        destructive: "bg-rose-600 text-white shadow-sm hover:bg-rose-500",
        ghost: "text-zinc-700 hover:bg-zinc-100"
      },
      size: {
        default: "h-11 px-4",
        sm: "h-9 px-3 text-xs",
        lg: "h-12 px-6"
      }
    },
    defaultVariants: {
      variant: "default",
      size: "default"
    }
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => (
    <button ref={ref} className={cn(buttonVariants({ variant, size }), className)} {...props} />
  )
);
Button.displayName = "Button";

export { Button, buttonVariants };
