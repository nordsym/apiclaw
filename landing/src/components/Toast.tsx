"use client";

import { useCallback, useEffect, useState } from "react";
import { Check, X, AlertCircle, Info } from "lucide-react";

export type ToastType = "success" | "error" | "info";

interface ToastProps {
  message: string;
  type?: ToastType;
  duration?: number;
  onClose: () => void;
}

export function Toast({ message, type = "success", duration = 5000, onClose }: ToastProps) {
  const [isVisible, setIsVisible] = useState(true);
  const [isLeaving, setIsLeaving] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLeaving(true);
      setTimeout(onClose, 300);
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const handleClose = () => {
    setIsLeaving(true);
    setTimeout(onClose, 300);
  };

  const icons = {
    success: <Check className="w-5 h-5" />,
    error: <AlertCircle className="w-5 h-5" />,
    info: <Info className="w-5 h-5" />,
  };

  const colors = {
    success: "bg-green-500/20 border-green-500/50 text-green-500",
    error: "bg-red-500/20 border-red-500/50 text-red-500",
    info: "bg-blue-500/20 border-blue-500/50 text-blue-500",
  };

  const iconBg = {
    success: "bg-green-500/20",
    error: "bg-red-500/20",
    info: "bg-blue-500/20",
  };

  return (
    <div
      className={`fixed top-4 right-4 z-[100] flex items-center gap-3 px-4 py-3 rounded-xl border backdrop-blur-sm shadow-lg transition-all duration-300 ${
        colors[type]
      } ${isLeaving ? "opacity-0 translate-x-4" : "opacity-100 translate-x-0"}`}
    >
      <div className={`w-8 h-8 rounded-lg ${iconBg[type]} flex items-center justify-center flex-shrink-0`}>
        {icons[type]}
      </div>
      <span className="text-[var(--text-primary)] font-medium">{message}</span>
      <button
        onClick={handleClose}
        className="ml-2 p-1 rounded-lg hover:bg-white/10 transition"
      >
        <X className="w-4 h-4 text-[var(--text-muted)]" />
      </button>
    </div>
  );
}

// Hook for managing toasts
export function useToast() {
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);

  const showToast = useCallback((message: string, type: ToastType = "success") => {
    setToast({ message, type });
  }, []);

  const hideToast = useCallback(() => {
    setToast(null);
  }, []);

  return { toast, showToast, hideToast };
}
