"use client";

import { useToast } from "@/hooks/use-toast";

export function Toaster() {
  const { toasts } = useToast();

  return (
    <div className="fixed bottom-0 right-0 z-[100] flex max-h-screen w-full flex-col-reverse gap-2 p-4 sm:bottom-0 sm:right-0 sm:top-auto sm:flex-col md:max-w-[420px]">
      {toasts.filter((toast) => toast.open !== false).map((toast) => {
        const variant = (toast as any).variant || "default";

        let bgClass = "bg-card/90 border-border";
        if (variant === "destructive" || variant === "error") {
          bgClass = "bg-destructive/90 border-destructive text-destructive-foreground";
        } else if (variant === "success") {
          bgClass = "bg-primary/90 border-primary text-primary-foreground";
        }

        return (
          <div
            key={toast.id}
            className={`pointer-events-auto w-full max-w-sm rounded-lg border p-4 shadow-lg backdrop-blur-sm transition-all animate-in slide-in-from-right ${bgClass}`}
          >
            <div className="flex items-start gap-3">
              <div className="flex-1">
                {toast.title && <div className="text-sm font-semibold">{toast.title}</div>}
                {toast.description && (
                  <div className="mt-1 text-sm opacity-90">{toast.description}</div>
                )}
              </div>
              {toast.action}
            </div>
          </div>
        );
      })}
    </div>
  );
}
