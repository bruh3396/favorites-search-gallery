import { describe, expect, test } from "vitest";
import { MemoryScheduler } from "@/adapters/memory/ports/scheduler/scheduler";
import { FavoritesId } from "@/features/favorites/types/selectors";
import { FavoritesShell } from "@/features/favorites/shell/shell";
import { FavoritesStatus } from "@/features/favorites/view/status/status";
import { Shell } from "@/app/context/shell";
import { createEnvironment } from "@/testing/environment";

interface Setup {
  status: FavoritesStatus;
  shell: FavoritesShell;
  scheduler: MemoryScheduler;
}

function setup(): Setup {
  const environment = createEnvironment();
  const shell = new FavoritesShell(environment, new Shell());
  const scheduler = new MemoryScheduler();
  return { status: new FavoritesStatus(shell.toolbar, shell.toolbarRoot, scheduler), shell, scheduler };
}

function readStatus(shell: FavoritesShell): string | null {
  return shell.toolbar.loadStatus.textContent;
}

function queryProgressBar(shell: FavoritesShell): HTMLElement {
  return shell.toolbarRoot.querySelector(`#${FavoritesId.loadProgressBar}`) as HTMLElement;
}

function readProgress(shell: FavoritesShell): string | null {
  const bar = queryProgressBar(shell);
  return bar.dataset.visible === undefined ? null : (bar.firstElementChild as HTMLElement).style.width;
}

describe("FavoritesStatus", () => {
  test("starts with a hidden progress bar", () => {
    const { shell } = setup();

    expect(readProgress(shell)).toBeNull();
  });

  test("shows a status until it's cleared", () => {
    const { status, shell, scheduler } = setup();

    status.setStatus("Peeling apples");
    scheduler.advance(60_000);
    expect(readStatus(shell)).toBe("Peeling apples");
    status.clearStatus();
    expect(readStatus(shell)).toBe("");
  });

  test("a temporary status clears itself after a second", () => {
    const { status, shell, scheduler } = setup();

    status.setTemporaryStatus("Apple added");
    scheduler.advance(999);
    expect(readStatus(shell)).toBe("Apple added");
    scheduler.advance(1);
    expect(readStatus(shell)).toBe("");
  });

  test("a new status outlasts an earlier temporary one", () => {
    const { status, shell, scheduler } = setup();

    status.setTemporaryStatus("Apple added");
    status.setStatus("Peeling apples");
    scheduler.advance(1_000);
    expect(readStatus(shell)).toBe("Peeling apples");
  });

  test("counts results", () => {
    const { status, shell } = setup();

    status.setResultsCount(1);
    expect(shell.toolbar.resultsCount.textContent).toBe("1 Result");
    status.setResultsCount(3);
    expect(shell.toolbar.resultsCount.textContent).toBe("3 Results");
  });

  describe("updateFetchStatus", () => {
    test("without an expected total, shows only what's been fetched", () => {
      const { status, shell } = setup();

      status.updateFetchStatus(100, 7);
      expect(readStatus(shell)).toBe("Fetching - 100");
      expect(shell.toolbar.resultsCount.textContent).toBe("7 Results");
      expect(readProgress(shell)).toBeNull();
    });

    test("with an expected total, shows progress, then a time estimate", () => {
      const { status, shell, scheduler } = setup();

      status.setExpectedTotalFavoriteCount(600);
      status.updateFetchStatus(0, 0);
      expect(readStatus(shell)).toBe("Fetching - 0 / 600");
      scheduler.advance(2_000);
      status.updateFetchStatus(300, 0);
      expect(readStatus(shell)).toBe("Fetching - 300 / 600 -   2s");
      expect(readProgress(shell)).toBe("50%");
    });

    test("forgetting the expected total goes back to counting", () => {
      const { status, shell } = setup();

      status.setExpectedTotalFavoriteCount(500);
      status.setExpectedTotalFavoriteCount(null);
      status.updateFetchStatus(100, 0);
      expect(readStatus(shell)).toBe("Fetching - 100");
    });
  });

  describe("setLoadProgress", () => {
    test("shows how many have loaded out of the total", () => {
      const { status, shell } = setup();

      status.setLoadProgress({ loaded: 25, total: 100 });
      expect(readStatus(shell)).toBe("Loading favorites - 25 / 100");
      expect(readProgress(shell)).toBe("25%");
    });

    test("without a total, just says it's loading", () => {
      const { status, shell } = setup();

      status.setLoadProgress({ loaded: 0, total: 0 });
      expect(readStatus(shell)).toBe("Loading favorites");
      expect(readProgress(shell)).toBeNull();
    });
  });

  test("clearing hides the progress bar", () => {
    const { status, shell } = setup();

    status.setLoadProgress({ loaded: 25, total: 100 });
    status.clearStatus();
    expect(readProgress(shell)).toBeNull();
  });
});
