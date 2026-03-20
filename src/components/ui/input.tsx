import * as React from "react";
import { cn } from "@/lib/utils";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(({ className, ...props }, ref) => (
  <input
    ref={ref}
    className={cn(
      "flex h-9 w-full rounded-md border border-base bg-surface px-3 py-1 text-sm text-foreground shadow-sm transition-colors " +
        "placeholder:text-muted-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/40 disabled:opacity-50",
      className
    )}
    {...props}
  />
));
Input.displayName = "Input";
