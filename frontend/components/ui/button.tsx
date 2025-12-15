import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "cursor-pointer inline-flex items-center justify-center gap-2 whitespace-nowrap text-xs font-medium tracking-wide transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50 uppercase",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground border border-primary/50 hover:bg-primary/90 hover:shadow-[0_0_20px_rgba(0,255,136,0.3)]",
        destructive:
          "bg-destructive/10 text-destructive border border-destructive/30 hover:bg-destructive/20 hover:border-destructive/50",
        outline:
          "border border-primary/30 bg-transparent text-primary hover:bg-primary/10 hover:border-primary/50",
        secondary:
          "bg-secondary text-secondary-foreground border border-border hover:bg-secondary/80",
        ghost:
          "hover:bg-primary/10 hover:text-primary",
        link:
          "text-primary underline-offset-4 hover:underline",
        glow:
          "relative bg-primary text-primary-foreground border border-primary/50 shadow-[0_0_15px_rgba(0,255,136,0.2)] hover:shadow-[0_0_25px_rgba(0,255,136,0.4)] hover:bg-primary/90 before:absolute before:inset-0 before:rounded-[inherit] before:bg-gradient-to-r before:from-primary/0 before:via-primary/30 before:to-primary/0 before:opacity-0 hover:before:opacity-100 before:transition-opacity",
      },
      size: {
        default: "h-9 px-4 py-2 rounded",
        sm: "h-8 rounded px-3",
        lg: "h-11 rounded px-6",
        xl: "h-12 rounded px-8 text-sm",
        icon: "h-9 w-9 rounded",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
