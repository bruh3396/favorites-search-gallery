import { ExitKey, ForwardNavigationKey, NavigationKey } from "@/types/input";

const exitKeys: ReadonlySet<ExitKey> = new Set(["Escape", "Delete", "Backspace"]);
const navigationKeys: ReadonlySet<NavigationKey> = new Set(["a", "A", "ArrowLeft", "d", "D", "ArrowRight"]);
const forwardNavigationKeys: ReadonlySet<ForwardNavigationKey> = new Set(["d", "D", "ArrowRight"]);

export const isExitKey = (value: unknown): value is ExitKey => exitKeys.has(value as ExitKey);
export const isNavigationKey = (value: unknown): value is NavigationKey => navigationKeys.has(value as NavigationKey);
export const isForwardNavigationKey = (value: NavigationKey): value is ForwardNavigationKey => forwardNavigationKeys.has(value as ForwardNavigationKey);

export function navigationDelta(direction: NavigationKey): number {
  return isForwardNavigationKey(direction) ? 1 : -1;
}
