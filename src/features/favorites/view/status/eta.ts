import { FAVORITES_PER_PAGE } from "@/lib/constants";
import { average } from "@/utils/pure/number";

const ROLLING_WINDOW = 10;

export class FavoritesEta {
  private last: number | null = null;
  private readonly recentElapsed: number[] = [];

  public getEta(current: number, total: number): string | null {
    const now = Date.now();

    if (this.last === null) {
      this.last = now;
      return null;
    }
    this.recentElapsed.push(now - this.last);

    if (this.recentElapsed.length > ROLLING_WINDOW) {
      this.recentElapsed.shift();
    }
    const remaining = total - current;
    const seconds = Math.ceil((remaining / FAVORITES_PER_PAGE) * (average(this.recentElapsed) / 1_000));

    this.last = now;
    return this.format(seconds);
  }

  private format(seconds: number): string {
    if (seconds >= 60) {
      return `${Math.ceil(seconds / 60)}m`;
    }
    return `${String(seconds).padStart(3, " ")}s`;
  }
}
