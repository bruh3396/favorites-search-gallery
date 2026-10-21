import { Workspace, persistWorkspace, restoreWorkspace } from "@/core/app/favorites_page/workspace/stored_workspace";
import { describe, expect, test } from "vitest";
import { DEFAULT_SEARCH_SETTINGS } from "@/core/features/favorites/search/inputs";
import { MemoryLocalKeyedValues } from "@/adapters/memory/ports/local_keyed_values/local_keyed_values";
import { Signal } from "@/core/utils/reactive/signal";

const DEFAULT_WORKSPACE: Workspace = { panes: [{ tabs: [DEFAULT_SEARCH_SETTINGS] }] };

function createWorkspace(...panes: string[][]): Workspace {
  return { panes: panes.map(queries => ({ tabs: queries.map(query => ({ ...DEFAULT_SEARCH_SETTINGS, query })) })) };
}

function setup(stored?: unknown): MemoryLocalKeyedValues {
  const storage = new MemoryLocalKeyedValues();

  if (stored !== undefined) {
    storage.set("favoritesWorkspace", { 1: stored });
  }
  return storage;
}

describe("restoreWorkspace", () => {
  test("restores the workspace that was saved", () => {
    const storage = setup();
    const workspace = createWorkspace(["", "apple"], ["", "banana"]);

    persistWorkspace(storage, "1", new Signal(workspace));
    expect(restoreWorkspace(storage, "1")).toEqual(workspace);
  });

  test("restores only the given owner's workspace", () => {
    const storage = setup();

    persistWorkspace(storage, "1", new Signal(createWorkspace(["apple"])));
    persistWorkspace(storage, "2", new Signal(createWorkspace(["banana"])));
    expect(restoreWorkspace(storage, "1")).toEqual(createWorkspace(["apple"]));
  });

  test("drops a tab that isn't a record and keeps the rest", () => {
    expect(restoreWorkspace(setup({ panes: [{ tabs: ["apple", { query: "banana" }] }] }), "1")).toEqual(createWorkspace(["banana"]));
  });

  test("fills a tab's invalid field with its default", () => {
    const storage = setup({ panes: [{ tabs: [{ query: "apple", sortKey: "unknown" }] }] });

    expect(restoreWorkspace(storage, "1").panes[0].tabs[0]).toEqual({ ...DEFAULT_SEARCH_SETTINGS, query: "apple" });
  });

  test("drops a pane left without tabs", () => {
    const storage = setup({ panes: [{ tabs: [] }, { tabs: [{ query: "apple" }] }, "pane"] });

    expect(restoreWorkspace(storage, "1")).toEqual(createWorkspace(["apple"]));
  });

  test("restores one pane with a default tab when nothing was saved", () => {
    expect(restoreWorkspace(setup(), "1")).toEqual(DEFAULT_WORKSPACE);
  });

  test("restores one pane with a default tab when no pane survives", () => {
    expect(restoreWorkspace(setup({ panes: [{ tabs: ["apple"] }] }), "1")).toEqual(DEFAULT_WORKSPACE);
  });

  test("restores one pane with a default tab when the stored workspace isn't a record", () => {
    expect(restoreWorkspace(setup("workspace"), "1")).toEqual(DEFAULT_WORKSPACE);
  });
});

describe("persistWorkspace", () => {
  test("saves the workspace each time it changes", () => {
    const storage = setup();
    const workspace = new Signal(createWorkspace(["apple"]));

    persistWorkspace(storage, "1", workspace);
    workspace.value = createWorkspace(["apple", "banana"]);
    expect(restoreWorkspace(storage, "1")).toEqual(createWorkspace(["apple", "banana"]));
  });

  test("stops saving once stopped", () => {
    const storage = setup();
    const workspace = new Signal(createWorkspace(["apple"]));

    persistWorkspace(storage, "1", workspace)();
    workspace.value = createWorkspace(["banana"]);
    expect(restoreWorkspace(storage, "1")).toEqual(createWorkspace(["apple"]));
  });
});
