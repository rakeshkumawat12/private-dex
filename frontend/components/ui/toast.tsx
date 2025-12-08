"use client";

import * as React from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

type ToastProps = {
  id: string;
  title?: string;
  description?: string;
  variant?: "default" | "success" | "error";
  onClose: () => void;
};

const Toast = ({ title, description, variant = "default", onClose }: ToastProps) => {
  const variantStyles = {
    default: "bg-card border-border",
    success: "bg-green-900/20 border-green-500/50",
    error: "bg-red-900/20 border-red-500/50",
  };

  return (
    <div
      className={cn(
        "pointer-events-auto w-full max-w-sm rounded-lg border p-4 shadow-lg glass-card",
        variantStyles[variant]
      )}
    >
      <div className="flex items-start gap-3">
        <div className="flex-1">
          {title && <div className="text-sm font-semibold">{title}</div>}
          {description && (
            <div className="mt-1 text-sm text-muted-foreground">{description}</div>
          )}
        </div>
        <button
          onClick={onClose}
          className="rounded-md p-1 hover:bg-accent transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};

export { Toast };
export type { ToastProps };
