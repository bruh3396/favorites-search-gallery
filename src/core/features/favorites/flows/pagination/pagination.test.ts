import { Signal, effect } from "@/core/utils/reactive/signal";
import { describe, expect, test, vi } from "vitest";
import { FavoritesPaginationFlow } from "@/core/features/favorites/flows/pagination/pagination";
import { PaginationSettings } from "@/core/features/favorites/types/pagination";
import { Preference } from "@/core/utils/reactive/preference";

interface Setup {
  flow: FavoritesPaginationFlow;
  paginationSettings: Preference<PaginationSettings>;
  page: Signal<number>;
}

function createPreference<T>(initial: T): Preference<T> {
  const current = new Signal(initial);
  return {
    get value(): T {
      return current.value;
    },
    peek: (): T => current.peek(),
    set: (value: T): void => {
      current.value = value;
    }
  };
}

function setup(): Setup {
  const paginationSettings = createPreference<PaginationSettings>({ size: 50, infiniteScroll: false });
  const page = new Signal(3);
  const flow = new FavoritesPaginationFlow({
    paginationSettings,
    goToFirstPage: (): void => {
      page.value = 1;
    }
  });
  return { flow, paginationSettings, page };
}

describe("FavoritesPaginationFlow", () => {
  describe("update", () => {
    test.each([
      { change: { size: 100 }, expected: { size: 100, infiniteScroll: false } },
      { change: { infiniteScroll: true }, expected: { size: 50, infiniteScroll: true } }
    ])("writes $change and goes to the first page", ({ change, expected }) => {
      const { flow, paginationSettings, page } = setup();

      flow.update(change);
      expect(paginationSettings.value).toEqual(expected);
      expect(page.value).toBe(1);
    });

    test("writes the settings and goes to the first page in one batch", () => {
      const { flow, paginationSettings, page } = setup();
      const runs: Array<[number, number]> = [];
      const stop = effect(() => {
        runs.push([paginationSettings.value.size, page.value]);
      });

      flow.update({ size: 100 });
      expect(runs).toEqual([[50, 3], [100, 1]]);
      stop();
    });

    test.each([{}, { size: 50 }, { infiniteScroll: false }])("writes nothing and stays on the page for an update to the current settings: %o", change => {
      const { flow, paginationSettings, page } = setup();
      const set = vi.spyOn(paginationSettings, "set");

      flow.update(change);
      expect(set).not.toHaveBeenCalled();
      expect(page.value).toBe(3);
    });
  });
});
