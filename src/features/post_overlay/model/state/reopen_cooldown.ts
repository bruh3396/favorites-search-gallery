import { Timeout } from "@/types/async";

const REOPEN_COOLDOWN = 300;

let timeoutId: Timeout | null = null;

export function isCoolingDown(): boolean {
  return timeoutId !== null;
}

export function start(onElapsed: () => void): void {
  if (timeoutId !== null) {
    clearTimeout(timeoutId);
  }
  timeoutId = setTimeout(() => {
    timeoutId = null;
    onElapsed();
  }, REOPEN_COOLDOWN);
}
