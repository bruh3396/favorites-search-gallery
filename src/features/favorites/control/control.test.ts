import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { AppContext } from "@/app/context/context";
import { FavoritesControl } from "@/features/favorites/control/control";
import { FavoritesShell } from "@/features/favorites/shell/shell";
import { Shell } from "@/app/context/shell";
import { createAppContext } from "@/testing/context";
import { createEnvironment } from "@/testing/environment";

interface Setup {
  context: AppContext;
  shell: FavoritesShell;
  control: FavoritesControl;
  searchField: HTMLTextAreaElement;
  searched: string[];
}

function setup(): Setup {
  const appShell = new Shell(createEnvironment());
  const context = createAppContext({ shell: appShell });
  const shell = new FavoritesShell(appShell, context.environment);
  const control = new FavoritesControl(context, shell);
  const searched: string[] = [];

  document.body.append(appShell.root);
  context.events.favorites.searchRequested.on(query => searched.push(query));
  return { context, shell, control, searchField: shell.toolbar.searchField.querySelector("textarea") as HTMLTextAreaElement, searched };
}

describe("FavoritesControl", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", () => Promise.resolve(new Response("[]")));
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    localStorage.clear();
    document.body.replaceChildren();
  });

  test("adds tags to the search, and excludes them", () => {
    const { control, searchField } = setup();

    control.appendToSearch("cat");
    control.excludeFromSearch("dog");
    expect(searchField.value).toBe("cat -dog");
  });

  test("runs a search", () => {
    const { control, searchField, searched } = setup();

    control.runSearch("cat");
    expect(searchField.value).toBe("cat");
    expect(searched).toEqual(["cat"]);
  });

  test("clears the search", () => {
    const { control, searchField } = setup();

    control.appendToSearch("cat");
    control.clearSearch();
    expect(searchField.value).toBe("");
  });

  test("a search button click searches, and a ctrl-click asks for the post list", () => {
    const { context, control, searched } = setup();
    const postLists: string[] = [];

    context.events.favorites.postListRequested.on(query => postLists.push(query));
    control.appendToSearch("cat");
    control.handleSearchButtonClicked(new MouseEvent("click"));
    control.handleSearchButtonClicked(new MouseEvent("click", { ctrlKey: true }));
    expect(searched).toEqual(["cat"]);
    expect(postLists).toEqual(["cat"]);
  });

  test("keeps the search being typed across a reload", () => {
    const first = setup();

    first.control.appendToSearch("cat");
    document.body.replaceChildren();
    expect(setup().searchField.value).toBe("cat");
  });

  test("fills its own drawer sections, and mounts the ones it is given", () => {
    const { shell, control } = setup();
    const downloader = document.createElement("div");
    const ownSections = ["settings", "change", "help"] as const;

    control.mountDrawerSections({ download: { mount: (container) => container.append(downloader) } });

    for (const name of ownSections) {
      expect(shell.drawer[name].body.childElementCount).toBeGreaterThan(0);
    }
    expect(shell.drawer.download.body.contains(downloader)).toBe(true);
  });
});
