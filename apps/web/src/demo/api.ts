import type { ApiResponse } from "../types/api";
import type { DemoRequest } from "./types";
import { readState, saveState, DemoError } from "./store";
import { resolveImages, clearImages } from "./images";
import { createSeed } from "./seed";
import { accounts } from "./accounts";
import { marketplace } from "./marketplace";
import { community } from "./community";
import { chat } from "./chat";
import { admin } from "./admin";
import { compare } from "./compare";
import { demoBanners } from "./banners";

type Options = RequestInit & { throwOnAbort?: boolean };
let queue: Promise<unknown> = Promise.resolve();
async function dispatch(endpoint: string, options: Options): Promise<ApiResponse<unknown>> {
  if (options.signal?.aborted) {
    if (options.throwOnAbort) throw new DOMException("Request cancelled", "AbortError");
    return { success: false, error: { code: "ABORTED", message: "Request cancelled" } };
  }
  try {
    const url = new URL(endpoint, "https://demo.invalid");
    const request: DemoRequest = { state: readState(), path: url.pathname.replace(/\/$/, ""),
      query: url.searchParams, method: (options.method ?? "GET").toUpperCase(),
      body: typeof options.body === "string" ? JSON.parse(options.body) as Record<string, unknown> : {},
      form: options.body instanceof FormData ? options.body : undefined };
    let result: unknown;
    if (request.path === "/demo/reset" && request.method === "POST") {
      await clearImages(); request.state = createSeed(); result = { success: true };
    }
    else if (request.path === "/system/status" && request.method === "GET") result = { MaintenanceMode: false, RegistrationEnabled: false };
    else if (request.path === "/banners" && request.method === "GET") result = { success: true, statusCode: 200, banners: demoBanners };
    else for (const handler of [accounts, marketplace, community, chat, admin, compare]) {
      result = await handler(request);
      if (result !== undefined) break;
    }
    if (result === undefined) throw new DemoError("DEMO_UNAVAILABLE", "This action is unavailable in the portfolio demo. / هذا الإجراء غير متاح في العرض التجريبي.");
    saveState(request.state);
    return { success: true, data: await resolveImages(structuredClone(result)) };
  } catch (error) {
    return { success: false, error: { code: error instanceof DemoError ? error.code : "DEMO_ERROR",
      message: error instanceof Error ? error.message : "Unable to complete this demo action." } };
  }
}
export function demoRequest<T>(endpoint: string, options: Options = {}): Promise<ApiResponse<T>> {
  // Serializing mutations prevents image uploads, polling and parallel requests from losing updates.
  const pending = queue.then(() => dispatch(endpoint, options));
  queue = pending.catch(() => undefined);
  return pending as Promise<ApiResponse<T>>;
}
