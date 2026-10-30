import { createSeed } from "./seed";
import type { DemoState, DemoUser } from "./types";

export const DEMO_STORAGE_KEY = "tijarahjo_demo_v1";
let memory: DemoState | undefined;
let memoryOnly = false;
export const hasPersistentStorage = () => !memoryOnly;
export function readState(): DemoState {
  if (memoryOnly) return structuredClone(memory ?? createSeed());
  try {
    const raw = localStorage.getItem(DEMO_STORAGE_KEY);
    if (raw) {
      const value = JSON.parse(raw) as DemoState;
      if (value.version === 1 && Array.isArray(value.posts) && Array.isArray(value.users) &&
        Array.isArray(value.messages) && Array.isArray(value.reports) && Array.isArray(value.audit) &&
        Array.isArray(value.reviews) && Array.isArray(value.comments) && Array.isArray(value.notifications) &&
        value.favorites && Number.isFinite(value.nextId)) return value;
    }
  } catch { /* Damaged storage is replaced by a clean dataset. */ }
  return createSeed();
}
export function saveState(state: DemoState): void {
  memory = structuredClone(state);
  try { localStorage.setItem(DEMO_STORAGE_KEY, JSON.stringify(state)); memoryOnly = false; }
  catch { memoryOnly = true; }
}
export function resetState(): void { saveState(createSeed()); }

export const isActiveUser = (user: DemoUser) => !user.IsDeleted && user.Status === 1 && !(Date.parse(user.SuspendedUntil ?? "") > Date.now());
export function currentUser(state: DemoState) { return state.users.find(u => u.Id === state.session && isActiveUser(u)); }
export class DemoError extends Error {
  constructor(public code: string, message: string) { super(message); }
}
export function requireUser(state: DemoState) {
  const user = currentUser(state);
  if (!user) throw new DemoError("HTTP_401", "Choose a demo account to try this action.");
  return user;
}
export function requireAdmin(state: DemoState) {
  const user = requireUser(state);
  if (user.RoleID !== 1) throw new DemoError("HTTP_403", "This action requires the Admin demo account.");
  return user;
}
export function requireOwner(state: DemoState, owner: string | number) {
  const user = requireUser(state);
  if (String(user.Id) !== String(owner) && user.RoleID !== 1)
    throw new DemoError("HTTP_403", "You can only change your own demo content.");
  return user;
}
