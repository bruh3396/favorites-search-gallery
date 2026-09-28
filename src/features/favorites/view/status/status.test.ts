import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { FAVORITES_PER_PAGE } from "@/adapters/rule34/client/site/favorites_page/favorites_page";
import { FavoritesId } from "@/features/favorites/types/selectors";
import { FavoritesShell } from "@/features/favorites/shell/shell";
import { FavoritesStatus } from "@/features/favorites/view/status/status";
import { Shell } from "@/app/context/shell";
import { createEnvironment } from "@/testing/environment";

interface Setup {
  status: FavoritesStatus;
  shell: FavoritesShell;
}

function setup(): Setup {
  const environment = createEnvironment();
  const shell = new FavoritesShell(new Shell(environment), environment);
  return { status: new FavoritesStatus(shell.toolbar, shell.toolbarRoot), shell };
}

function statusOf(shell: FavoritesShell): string | null {
  return shell.toolbar.loadStatus.textContent;
}

function progressBarOf(shell: FavoritesShell): HTMLElement {
  return shell.toolbarRoot.querySelector(`#${FavoritesId.loadProgressBar}`) as HTMLElement;
}

function progressOf(shell: FavoritesShell): string | null {
  const bar = progressBarOf(shell);
  return bar.dataset.visible === undefined ? null : (bar.firstElementChild as HTMLElement).style.width;
}

describe("FavoritesStatus", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  test("starts with a hidden progress bar", () => {
    const { shell } = setup();

    expect(progressOf(shell)).toBeNull();
  });

  test("shows a status until it's cleared", () => {
    const { status, shell } = setup();

    status.setStatus("Peeling apples");
    vi.advanceTimersByTime(60_000);
    expect(statusOf(shell)).toBe("Peeling apples");
    status.clearStatus();
    expect(statusOf(shell)).toBe("");
  });

  test("a temporary status clears itself after a second", () => {
    const { status, shell } = setup();

    status.setTemporaryStatus("Apple added");
    vi.advanceTimersByTime(999);
    expect(statusOf(shell)).toBe("Apple added");
    vi.advanceTimersByTime(1);
    expect(statusOf(shell)).toBe("");
  });

  test("a new status outlasts an earlier temporary one", () => {
    const { status, shell } = setup();

    status.setTemporaryStatus("Apple added");
    status.setStatus("Peeling apples");
    vi.advanceTimersByTime(1_000);
    expect(statusOf(shell)).toBe("Peeling apples");
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
      expect(statusOf(shell)).toBe("Fetching - 100");
      expect(shell.toolbar.resultsCount.textContent).toBe("7 Results");
      expect(progressOf(shell)).toBeNull();
    });

    test("with an expected total, shows progress, then a time estimate", () => {
      const { status, shell } = setup();
      const total = FAVORITES_PER_PAGE * 10;

      status.setExpectedTotalFavoritesCount(total);
      status.updateFetchStatus(0, 0);
      expect(statusOf(shell)).toBe(`Fetching - 0 / ${total}`);
      vi.advanceTimersByTime(2_000);
      status.updateFetchStatus(total / 2, 0);
      expect(statusOf(shell)).toBe(`Fetching - ${total / 2} / ${total} -  10s`);
      expect(progressOf(shell)).toBe("50%");
    });

    test("forgetting the expected total goes back to counting", () => {
      const { status, shell } = setup();

      status.setExpectedTotalFavoritesCount(500);
      status.setExpectedTotalFavoritesCount(null);
      status.updateFetchStatus(100, 0);
      expect(statusOf(shell)).toBe("Fetching - 100");
    });
  });

  describe("setLoadProgress", () => {
    test("shows how many have loaded out of the total", () => {
      const { status, shell } = setup();

      status.setLoadProgress(25, 100);
      expect(statusOf(shell)).toBe("Loading favorites - 25 / 100");
      expect(progressOf(shell)).toBe("25%");
    });

    test("without a total, just says it's loading", () => {
      const { status, shell } = setup();

      status.setLoadProgress(0, 0);
      expect(statusOf(shell)).toBe("Loading favorites");
      expect(progressOf(shell)).toBeNull();
    });
  });

  test("clearing hides the progress bar", () => {
    const { status, shell } = setup();

    status.setLoadProgress(25, 100);
    status.clearStatus();
    expect(progressOf(shell)).toBeNull();
  });
});
