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
      return "border-emerald-200 bg-emerald-50 text-emerald-950 dark:border-emerald-900 dark:bg-emerald-950/80 dark:text-emerald-100";
    case "error":
      return "border-rose-200 bg-rose-50 text-rose-950 dark:border-rose-900 dark:bg-rose-950/80 dark:text-rose-100";
    case "info":
      return "border-sky-200 bg-sky-50 text-sky-950 dark:border-sky-900 dark:bg-sky-950/80 dark:text-sky-100";
    case "warning":
      return "border-amber-200 bg-amber-50 text-amber-950 dark:border-amber-900 dark:bg-amber-950/80 dark:text-amber-100";
    case "default":
    default:
      return "border-border bg-popover text-popover-foreground";
  }
}

function getActionButtonClasses(kind: ToastKind, destructive = false) {
  if (destructive) {
    return "border-current/20 bg-transparent text-current hover:bg-black/5 dark:hover:bg-white/10";
  }

  switch (kind) {
    case "success":
      return "border-emerald-300/80 bg-emerald-100 text-emerald-900 hover:bg-emerald-200 dark:border-emerald-700 dark:bg-emerald-900/70 dark:text-emerald-100 dark:hover:bg-emerald-900";
    case "error":
      return "border-rose-300/80 bg-rose-100 text-rose-900 hover:bg-rose-200 dark:border-rose-700 dark:bg-rose-900/70 dark:text-rose-100 dark:hover:bg-rose-900";
    case "info":
      return "border-sky-300/80 bg-sky-100 text-sky-900 hover:bg-sky-200 dark:border-sky-700 dark:bg-sky-900/70 dark:text-sky-100 dark:hover:bg-sky-900";
    case "warning":
      return "border-amber-300/80 bg-amber-100 text-amber-900 hover:bg-amber-200 dark:border-amber-700 dark:bg-amber-900/70 dark:text-amber-100 dark:hover:bg-amber-900";
    case "default":
    default:
      return "border-border bg-background text-foreground hover:bg-accent";
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
        "pointer-events-auto w-full rounded-2xl border shadow-lg ring-1 ring-black/5 backdrop-blur-sm transition-transform duration-200 ease-out",
        "dark:ring-white/5",
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
        "pointer-events-none fixed z-[120] flex w-[calc(100vw-2rem)] max-w-sm flex-col gap-3 sm:max-w-md",
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
