import * as React from "react";
import { cn } from "@/lib/utils";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(({ className, ...props }, ref) => {
  return (
    <input
      ref={ref}
      className={cn(
        "flex h-11 w-full rounded-xl border border-zinc-200 bg-white px-3.5 py-2 text-sm font-medium text-zinc-950 shadow-sm transition-all placeholder:text-zinc-400 focus-visible:border-zinc-400 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-zinc-200/70",
        className
      )}
      {...props}
    />
  );
});
Input.displayName = "Input";

export { Input };
