import { FAVORITES_PER_PAGE } from "../../../../lib/rule34_constants";
import { average } from "../../../../utils/number";

let last: number | null = null;
const recentElapsed: number[] = [];
const ROLLING_WINDOW = 10;

export function getEta(current: number, total: number): string | null {
  const now = Date.now();

  if (last === null) {
    last = now;
    return null;
  }
  recentElapsed.push(now - last);

  if (recentElapsed.length > ROLLING_WINDOW) {
    recentElapsed.shift();
  }
  const remaining = total - current;
  const seconds = Math.ceil((remaining / FAVORITES_PER_PAGE) * (average(recentElapsed) / 1_000));

  last = now;
  return format(seconds);
}

function format(seconds: number): string {
  if (seconds >= 60) {
    return `   ~ ${Math.ceil(seconds / 60)}m`;
  }
  return `~${String(seconds).padStart(3, " ")}s`;
}
