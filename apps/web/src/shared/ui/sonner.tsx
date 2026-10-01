"use client";

import {
  useEffect,
  useMemo,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import { cn } from "./utils";

type ToastId = string;
type ToastKind = "default" | "success" | "error" | "info" | "warning";
type ToastPosition =
  | "top-left"
  | "top-center"
  | "top-right"
  | "bottom-left"
  | "bottom-center"
  | "bottom-right";

interface ToastAction {
  label: string;
  onClick: () => void;
}

export interface ToastOptions {
  id?: string | number;
  description?: ReactNode;
  duration?: number;
  action?: ToastAction;
  cancel?: ToastAction;
  className?: string;
}

interface ToastRecord extends ToastOptions {
  id: ToastId;
  kind: ToastKind;
  title: ReactNode;
}

export interface ToasterProps {
  position?: ToastPosition;
  richColors?: boolean;
  expand?: boolean;
  visibleToasts?: number;
  className?: string;
  theme?: "light" | "dark" | "system";
  dir?: "ltr" | "rtl" | "auto";
}

const DEFAULT_DURATION_MS = 4000;
const DEFAULT_VISIBLE_TOASTS = 3;

let toastSequence = 0;
let activeToasts: ToastRecord[] = [];
const listeners = new Set<() => void>();

const notifyListeners = () => {
  listeners.forEach((listener) => listener());
};

const subscribeToToasts = (listener: () => void) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

const getToastSnapshot = () => activeToasts;

const createToastId = () => {
  toastSequence += 1;
  return `toast-${Date.now()}-${toastSequence}`;
};

const addToast = (
  kind: ToastKind,
  title: ReactNode,
  options?: ToastOptions,
): ToastId => {
  const id = String(options?.id ?? createToastId());
  const nextToast: ToastRecord = {
    ...options,
    id,
    kind,
    title,
  };

  activeToasts = [nextToast, ...activeToasts.filter((toast) => toast.id !== id)];
  notifyListeners();
  return id;
};

const dismissToast = (id?: string | number) => {
  if (typeof id === "undefined") {
    activeToasts = [];
    notifyListeners();
    return;
  }

  const normalizedId = String(id);
  const nextToasts = activeToasts.filter((toast) => toast.id !== normalizedId);
  if (nextToasts.length === activeToasts.length) {
    return;
  }

  activeToasts = nextToasts;
  notifyListeners();
};

type ToastApi = ((message: ReactNode, options?: ToastOptions) => ToastId) & {
  success: (message: ReactNode, options?: ToastOptions) => ToastId;
  error: (message: ReactNode, options?: ToastOptions) => ToastId;
  info: (message: ReactNode, options?: ToastOptions) => ToastId;
  warning: (message: ReactNode, options?: ToastOptions) => ToastId;
  dismiss: (id?: string | number) => void;
};

export const toast: ToastApi = Object.assign(
  (message: ReactNode, options?: ToastOptions) =>
    addToast("default", message, options),
  {
    success: (message: ReactNode, options?: ToastOptions) =>
      addToast("success", message, options),
    error: (message: ReactNode, options?: ToastOptions) =>
      addToast("error", message, options),
    info: (message: ReactNode, options?: ToastOptions) =>
      addToast("info", message, options),
    warning: (message: ReactNode, options?: ToastOptions) =>
      addToast("warning", message, options),
    dismiss: (id?: string | number) => dismissToast(id),
  },
);

function getViewportClasses(position: ToastPosition) {
  switch (position) {
    case "top-left":
      return "top-4 left-4 items-start";
    case "top-right":
      return "top-4 right-4 items-end";
    case "bottom-left":
      return "bottom-4 left-4 items-start";
    case "bottom-center":
      return "bottom-4 left-1/2 -translate-x-1/2 items-center";
    case "bottom-right":
      return "bottom-4 right-4 items-end";
    case "top-center":
    default:
      return "top-4 left-1/2 -translate-x-1/2 items-center";
  }
}

function getToastClasses(kind: ToastKind, richColors: boolean) {
  if (!richColors) {
    return "border-border bg-popover text-popover-foreground";
  }

  switch (kind) {
    case "success":
      return "border-emerald-600 bg-emerald-600 text-white font-bold shadow-emerald-900/10";
    case "error":
      return "border-destructive bg-destructive text-destructive-foreground font-bold shadow-destructive/20";
    case "info":
      return "border-info bg-info text-info-foreground font-bold shadow-info/20";
    case "warning":
      return "border-amber-500 bg-amber-500 text-white font-bold shadow-amber-900/10";
    case "default":
    default:
      return "border-border bg-popover text-popover-foreground shadow-2xl font-bold";
  }
}

function getActionButtonClasses(kind: ToastKind, destructive = false) {
  if (destructive) {
    return "border-current/20 bg-transparent text-current hover:bg-black/5 dark:hover:bg-white/10";
  }

  switch (kind) {
    case "success":
      return "border-emerald-300 bg-emerald-200 text-emerald-950 hover:bg-emerald-300 dark:border-emerald-700 dark:bg-emerald-800 dark:text-emerald-50 dark:hover:bg-emerald-700";
    case "error":
      return "border-rose-300 bg-rose-200 text-rose-950 hover:bg-rose-300 dark:border-rose-700 dark:bg-rose-800 dark:text-rose-50 dark:hover:bg-rose-700";
    case "info":
      return "border-white/20 bg-white/10 text-white hover:bg-white/20 dark:border-white/30 dark:bg-white/10 dark:hover:bg-white/20";
    case "warning":
      return "border-amber-300 bg-amber-200 text-amber-950 hover:bg-amber-300 dark:border-amber-700 dark:bg-amber-800 dark:text-amber-50 dark:hover:bg-amber-700";
    case "default":
    default:
      return "border-border bg-muted text-foreground hover:bg-accent";
  }
}

function ToastCard({
  toastRecord,
  richColors,
}: {
  toastRecord: ToastRecord;
  richColors: boolean;
}) {
  useEffect(() => {
    const duration = toastRecord.duration ?? DEFAULT_DURATION_MS;
    if (duration <= 0) {
      return undefined;
    }

    const timeoutId = window.setTimeout(() => {
      dismissToast(toastRecord.id);
    }, duration);

    return () => window.clearTimeout(timeoutId);
  }, [toastRecord.duration, toastRecord.id]);

  const description = toastRecord.description;
  const hasActions = Boolean(toastRecord.action || toastRecord.cancel);

  return (
    <div
      className={cn(
        "pointer-events-auto w-full animate-pop-in rounded-2xl border shadow-2xl ring-1 ring-black/10 transition-all duration-300 ease-out",
        "dark:ring-white/10",
        getToastClasses(toastRecord.kind, richColors),
        toastRecord.className,
      )}
      role={toastRecord.kind === "error" ? "alert" : "status"}
      aria-live={toastRecord.kind === "error" ? "assertive" : "polite"}
    >
      <div className="flex items-start gap-3 px-4 py-3">
        <div className="min-w-0 flex-1">
          <div className="text-sm font-semibold leading-5">{toastRecord.title}</div>
          {description ? (
            <div className="mt-1 text-sm leading-5 opacity-90">{description}</div>
          ) : null}
          {hasActions ? (
            <div className="mt-3 flex flex-wrap gap-2">
              {toastRecord.action ? (
                <button
                  type="button"
                  className={cn(
                    "rounded-xl border px-3 py-1.5 text-xs font-semibold transition-colors",
                    getActionButtonClasses(toastRecord.kind),
                  )}
                  onClick={() => {
                    toastRecord.action?.onClick();
                    dismissToast(toastRecord.id);
                  }}
                >
                  {toastRecord.action.label}
                </button>
              ) : null}
              {toastRecord.cancel ? (
                <button
                  type="button"
                  className={cn(
                    "rounded-xl border px-3 py-1.5 text-xs font-semibold transition-colors",
                    getActionButtonClasses(toastRecord.kind, true),
                  )}
                  onClick={() => {
                    toastRecord.cancel?.onClick();
                    dismissToast(toastRecord.id);
                  }}
                >
                  {toastRecord.cancel.label}
                </button>
              ) : null}
            </div>
          ) : null}
        </div>
        <button
          type="button"
          aria-label="Dismiss notification"
          className="rounded-full p-1 text-current/70 transition-colors hover:bg-black/5 hover:text-current dark:hover:bg-white/10"
          onClick={() => dismissToast(toastRecord.id)}
        >
          <span aria-hidden="true" className="block text-base leading-none">
            ×
          </span>
        </button>
      </div>
    </div>
  );
}

export function Toaster({
  position = "top-center",
  richColors = false,
  expand = false,
  visibleToasts = DEFAULT_VISIBLE_TOASTS,
  className,
  dir = "auto",
}: ToasterProps) {
  const toasts = useSyncExternalStore(
    subscribeToToasts,
    getToastSnapshot,
    getToastSnapshot,
  );

  const visibleToastRecords = useMemo(() => {
    if (expand) {
      return toasts;
    }

    return toasts.slice(0, visibleToasts);
  }, [expand, toasts, visibleToasts]);

  if (visibleToastRecords.length === 0) {
    return null;
  }

  return (
    <div
      className={cn(
        "pointer-events-none fixed z-120 flex w-[calc(100vw-2rem)] max-w-sm flex-col gap-3 sm:max-w-md",
        getViewportClasses(position),
        className,
      )}
      dir={dir}
    >
      {visibleToastRecords.map((toastRecord) => (
        <ToastCard
          key={toastRecord.id}
          toastRecord={toastRecord}
          richColors={richColors}
        />
      ))}
    </div>
  );
}
