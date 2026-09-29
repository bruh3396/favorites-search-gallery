import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { FavoritesEta } from "@/features/favorites/view/status/eta";

function etaFor(eta: FavoritesEta, elapsed: number, current: number, total: number): string | null {
  vi.advanceTimersByTime(elapsed);
  return eta.getEta(current, total);
}

describe("FavoritesEta", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  test("has no estimate from a single sample", () => {
    expect(new FavoritesEta().getEta(0, 500)).toBeNull();
  });

  test("has no estimate while nothing arrives", () => {
    const eta = new FavoritesEta();

    eta.getEta(0, 500);
    expect(etaFor(eta, 2_000, 0, 500)).toBeNull();
  });

  test("estimates seconds from how fast favorites arrive", () => {
    const eta = new FavoritesEta();

    eta.getEta(0, 600);
    expect(etaFor(eta, 2_000, 100, 600)).toBe(" 10s");
  });

  test("works whatever size the batches are", () => {
    const eta = new FavoritesEta();

    eta.getEta(0, 600);
    etaFor(eta, 100, 5, 600);
    etaFor(eta, 1_400, 80, 600);
    expect(etaFor(eta, 500, 100, 600)).toBe(" 10s");
  });

  test("switches to minutes from a minute up", () => {
    const eta = new FavoritesEta();

    eta.getEta(0, 10_100);
    expect(etaFor(eta, 1_000, 100, 10_100)).toBe("2m");
  });

  test("measures only the most recent arrivals", () => {
    const eta = new FavoritesEta();

    eta.getEta(0, 2_100);
    etaFor(eta, 60_000, 100, 2_100);

    for (let count = 200; count < 1_100; count += 100) {
      etaFor(eta, 1_000, count, 2_100);
    }
    expect(etaFor(eta, 1_000, 1_100, 2_100)).toBe(" 10s");
  });
});
