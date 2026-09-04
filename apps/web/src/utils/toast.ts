import { toast } from "sonner";

type ToastMethod = "success" | "error" | "info" | "warning" | "message";
type ToastOptions = Record<string, unknown> | undefined;

const showToast = (method: ToastMethod, message: string, options?: ToastOptions) => {
  if (method === "message") {
    toast(message, options as never);
    return;
  }

  toast[method](message, options as never);
};

export const deferredToast = {
  success(message: string, options?: ToastOptions) {
    showToast("success", message, options);
  },
  error(message: string, options?: ToastOptions) {
    showToast("error", message, options);
  },
  info(message: string, options?: ToastOptions) {
    showToast("info", message, options);
  },
  warning(message: string, options?: ToastOptions) {
    showToast("warning", message, options);
  },
  message(message: string, options?: ToastOptions) {
    showToast("message", message, options);
  },
};
