import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { FAVORITES_PER_PAGE } from "@/lib/constants";
import { FavoritesEta } from "@/features/favorites/view/status/eta";

function etaFor(eta: FavoritesEta, elapsedMs: number, current: number, total: number): string | null {
  vi.advanceTimersByTime(elapsedMs);
  return eta.getEta(current, total);
}

describe("FavoritesEta", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  test("has no estimate before a second page arrives", () => {
    expect(new FavoritesEta().getEta(0, FAVORITES_PER_PAGE * 10)).toBeNull();
  });

  test("estimates seconds from how long the last page took", () => {
    const eta = new FavoritesEta();

    eta.getEta(0, FAVORITES_PER_PAGE * 10);
    expect(etaFor(eta, 2_000, FAVORITES_PER_PAGE * 5, FAVORITES_PER_PAGE * 10)).toBe(" 10s");
  });

  test("switches to minutes from a minute up", () => {
    const eta = new FavoritesEta();

    eta.getEta(0, FAVORITES_PER_PAGE * 100);
    expect(etaFor(eta, 1_000, FAVORITES_PER_PAGE * 10, FAVORITES_PER_PAGE * 100)).toBe("2m");
  });

  test("averages only the most recent pages", () => {
    const eta = new FavoritesEta();

    eta.getEta(0, FAVORITES_PER_PAGE * 20);
    etaFor(eta, 60_000, 0, FAVORITES_PER_PAGE * 20);

    for (let page = 1; page <= 10; page += 1) {
      etaFor(eta, 1_000, 0, FAVORITES_PER_PAGE * 20);
    }
    expect(etaFor(eta, 1_000, FAVORITES_PER_PAGE * 10, FAVORITES_PER_PAGE * 20)).toBe(" 10s");
  });
});
