interface ResolveSafeBackPathOptions {
  candidatePath: unknown;
  currentPath: string;
  fallbackPath?: string;
  blockedPathnames?: string[];
}

interface ResolveBackPathFromLocationStateOptions {
  locationState: unknown;
  currentPath: string;
  fallbackPath?: string;
  blockedPathnames?: string[];
}

interface ResolveBackPathFromHistoryStateOptions {
  historyState: unknown;
  currentPath: string;
  fallbackPath?: string;
  blockedPathnames?: string[];
}

const DEFAULT_FALLBACK_PATH = "/";

function normalizePath(value: unknown): string {
  if (typeof value !== "string") {
    return "";
  }

  return value.trim();
}

function toSafePathOrEmpty(value: unknown): string {
  const normalizedPath = normalizePath(value);
  if (!normalizedPath.startsWith("/")) {
    return "";
  }

  return normalizedPath;
}

function extractPathname(value: string): string {
  if (!value) {
    return DEFAULT_FALLBACK_PATH;
  }

  try {
    return new URL(value, "https://tijarahjo.local").pathname || DEFAULT_FALLBACK_PATH;
  } catch {
    const [pathname] = value.split(/[?#]/, 1);
    return pathname || DEFAULT_FALLBACK_PATH;
  }
}

function toBlockedPathnameSet(blockedPathnames: string[]): Set<string> {
  return new Set(
    blockedPathnames
      .map((pathname) => toSafePathOrEmpty(pathname))
      .filter(Boolean)
      .map((pathname) => extractPathname(pathname)),
  );
}

function readFromPathFromLocationState(locationState: unknown): string {
  if (typeof locationState !== "object" || locationState === null) {
    return "";
  }

  const stateRecord = locationState as { fromPath?: unknown };
  return normalizePath(stateRecord.fromPath);
}

function readFromPathFromHistoryState(historyState: unknown): string {
  if (typeof historyState !== "object" || historyState === null) {
    return "";
  }

  const stateRecord = historyState as { usr?: { fromPath?: unknown } };
  return normalizePath(stateRecord.usr?.fromPath);
}

export function buildCurrentPath(pathname: string, search = ""): string {
  const normalizedPathname = toSafePathOrEmpty(pathname);
  const normalizedSearch = typeof search === "string" ? search.trim() : "";

  return `${normalizedPathname || DEFAULT_FALLBACK_PATH}${normalizedSearch}`;
}

function resolveSafeBackPath({
  candidatePath,
  currentPath,
  fallbackPath = DEFAULT_FALLBACK_PATH,
  blockedPathnames = [],
}: ResolveSafeBackPathOptions): string {
  const safeFallbackPath = toSafePathOrEmpty(fallbackPath) || DEFAULT_FALLBACK_PATH;
  const safeCurrentPath = toSafePathOrEmpty(currentPath);
  const safeCandidatePath = toSafePathOrEmpty(candidatePath);

  if (!safeCandidatePath || safeCandidatePath === safeCurrentPath) {
    return safeFallbackPath;
  }

  const blockedPathnameSet = toBlockedPathnameSet(blockedPathnames);
  const candidatePathname = extractPathname(safeCandidatePath);

  if (blockedPathnameSet.has(candidatePathname)) {
    return safeFallbackPath;
  }

  return safeCandidatePath;
}

export function resolveBackPathFromLocationState({
  locationState,
  currentPath,
  fallbackPath = DEFAULT_FALLBACK_PATH,
  blockedPathnames = [],
}: ResolveBackPathFromLocationStateOptions): string {
  return resolveSafeBackPath({
    candidatePath: readFromPathFromLocationState(locationState),
    currentPath,
    fallbackPath,
    blockedPathnames,
  });
}

export function resolveBackPathFromHistoryState({
  historyState,
  currentPath,
  fallbackPath = DEFAULT_FALLBACK_PATH,
  blockedPathnames = [],
}: ResolveBackPathFromHistoryStateOptions): string {
  return resolveSafeBackPath({
    candidatePath: readFromPathFromHistoryState(historyState),
    currentPath,
    fallbackPath,
    blockedPathnames,
  });
}
