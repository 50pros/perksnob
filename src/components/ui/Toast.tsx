"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type ToastType = "success" | "error";

interface ToastItem {
  id: number;
  message: string;
  type: ToastType;
}

type ToastHandler = (message: string, type?: ToastType) => void;

// Global ref so showToast can be called from anywhere
let globalAddToast: ToastHandler | null = null;
let toastCounter = 0;

export function showToast(message: string, type: ToastType = "success") {
  if (globalAddToast) {
    globalAddToast(message, type);
  }
}

const typeStyles: Record<ToastType, string> = {
  success: "bg-emerald-600",
  error: "bg-red-600",
};

export function Toaster() {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const timers = useRef<Map<number, ReturnType<typeof setTimeout>>>(new Map());

  const addToast: ToastHandler = useCallback((message, type = "success") => {
    const id = ++toastCounter;
    setToasts((prev) => [...prev, { id, message, type }]);

    const timer = setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
      timers.current.delete(id);
    }, 3000);

    timers.current.set(id, timer);
  }, []);

  // Register the global handler
  useEffect(() => {
    globalAddToast = addToast;
    return () => {
      globalAddToast = null;
    };
  }, [addToast]);

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      timers.current.forEach((t) => clearTimeout(t));
    };
  }, []);

  if (toasts.length === 0) return null;

  return (
    <div
      className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-2"
      aria-live="polite"
      aria-atomic="false"
    >
      {toasts.map((toast) => (
        <div
          key={toast.id}
          role="status"
          className={[
            "animate-slide-in rounded-md px-4 py-2.5 text-sm font-medium text-white shadow-lg",
            typeStyles[toast.type],
          ].join(" ")}
        >
          {toast.message}
        </div>
      ))}
    </div>
  );
}
