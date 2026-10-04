import { describe, expect, test } from "vitest";
import { FavoritesEta } from "@/features/favorites/view/status/eta";
import { MemoryScheduler } from "@/adapters/memory/ports/scheduler/scheduler";

interface Setup {
  eta: FavoritesEta;
  scheduler: MemoryScheduler;
}

function setup(): Setup {
  const scheduler = new MemoryScheduler();
  return { eta: new FavoritesEta(scheduler), scheduler };
}

describe("FavoritesEta", () => {
  describe("getEta", () => {
    test("has no estimate from a single sample", () => {
      expect(setup().eta.getEta(0, 500)).toBeNull();
    });

    test("has no estimate while nothing arrives", () => {
      const { eta, scheduler } = setup();

      eta.getEta(0, 500);
      scheduler.advance(2_000);
      expect(eta.getEta(0, 500)).toBeNull();
    });

    test("estimates seconds from how fast favorites arrive", () => {
      const { eta, scheduler } = setup();

      eta.getEta(0, 600);
      scheduler.advance(2_000);
      expect(eta.getEta(100, 600)).toBe(" 10s");
    });

    test("works whatever size the batches are", () => {
      const { eta, scheduler } = setup();

      eta.getEta(0, 600);
      scheduler.advance(100);
      eta.getEta(5, 600);
      scheduler.advance(1_400);
      eta.getEta(80, 600);
      scheduler.advance(500);
      expect(eta.getEta(100, 600)).toBe(" 10s");
    });

    test("switches to minutes from a minute up", () => {
      const { eta, scheduler } = setup();

      eta.getEta(0, 10_100);
      scheduler.advance(1_000);
      expect(eta.getEta(100, 10_100)).toBe("2m");
    });

    test("measures only the most recent arrivals", () => {
      const { eta, scheduler } = setup();

      eta.getEta(0, 2_100);
      scheduler.advance(60_000);
      eta.getEta(100, 2_100);

      for (let count = 200; count < 1_100; count += 100) {
        scheduler.advance(1_000);
        eta.getEta(count, 2_100);
      }
      scheduler.advance(1_000);
      expect(eta.getEta(1_100, 2_100)).toBe(" 10s");
    });
  });
});
