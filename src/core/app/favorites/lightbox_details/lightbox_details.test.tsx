import {
  FavoriteLightboxDetailsClass, FavoriteLightboxDetailsView, createFavoriteLightboxDetails
} from "@/core/app/favorites/lightbox_details/lightbox_details";
import { Mock, describe, expect, test, vi } from "vitest";
import { h, render } from "@/core/ui/h/h";
import { Favorite } from "@/core/features/favorites/favorite";
import LIGHTBOX_DETAILS_CSS from "@/core/app/favorites/lightbox_details/lightbox_details.css?inline";
import { MemoryClipboard } from "@/adapters/memory/ports/clipboard/clipboard";
import { MemoryLocalKeyedValues } from "@/adapters/memory/ports/local_keyed_values/local_keyed_values";
import { MemoryScheduler } from "@/adapters/memory/ports/scheduler/scheduler";
import { Signal } from "@/core/utils/reactive/signal";
import { TagCategory } from "@/core/domain/tag/tag";
import { createLightboxPreferences } from "@/core/app/preferences";
import { expectClassesStyled } from "@/testing/css";
import { flushMicrotasks } from "@/testing/async";

type ShownFavorite = Pick<Favorite, "id" | "tags">;

function createFavorite(id: string, tags: readonly string[] = []): ShownFavorite {
  return { id, tags: new Set(tags) };
}

interface Setup {
  favorite: Signal<ShownFavorite | undefined>;
  getMany: Mock<(names: readonly string[]) => Promise<Map<string, TagCategory>>>;
  clipboard: MemoryClipboard;
  view: FavoriteLightboxDetailsView;
  copyButton: HTMLButtonElement;
  viewButton: HTMLButtonElement;
  viewSettings: HTMLElement;
  readId: () => string;
  readGroups: () => string[][];
  clickShowMore: () => void;
  chooseView: (label: string) => void;
}

function setup(initial: ShownFavorite | undefined, categories: ReadonlyMap<string, TagCategory> = new Map()): Setup {
  const favorite = new Signal<ShownFavorite | undefined>(initial);
  const getMany = vi.fn((names: readonly string[]) => Promise.resolve(new Map(names.flatMap(name => {
    const category = categories.get(name);
    return category === undefined ? [] : [[name, category] as const];
  }))));
  const clipboard = new MemoryClipboard();
  const preferences = createLightboxPreferences(new MemoryLocalKeyedValues());
  const view = { organization: preferences.detailsOrganization, alignment: preferences.detailsAlignment, size: preferences.detailsSize };
  const { result } = render(document, () => {
    const { title, controls, body } = createFavoriteLightboxDetails({
      favorite, view, localTagCategories: { getMany }, clipboard, scheduler: new MemoryScheduler()
    });
    return <div>{title}{controls}{body}</div> as HTMLElement;
  });
  const copyButton = result.querySelector<HTMLButtonElement>(`.${FavoriteLightboxDetailsClass.id} button`)!;
  const viewButton = result.querySelector<HTMLButtonElement>("[aria-label=\"View settings\"]")!;
  const viewSettings = result.querySelector<HTMLElement>(`.${FavoriteLightboxDetailsClass.view}`)!;
  const readId = (): string => copyButton.firstChild?.textContent ?? "";
  const readGroups = (): string[][] => [...result.querySelectorAll(`.${FavoriteLightboxDetailsClass.group}`)]
    .map(group => [...group.querySelectorAll<HTMLElement>("h3, li:not([hidden])")].map(element => element.textContent ?? ""));
  const clickShowMore = (): void => result.querySelector<HTMLButtonElement>(`.${FavoriteLightboxDetailsClass.showMore}`)!.click();
  const chooseView = (label: string): void => [...viewSettings.querySelectorAll<HTMLButtonElement>("button")]
    .find(button => button.getAttribute("aria-label") === label)!.click();
  return { favorite, getMany, clipboard, view, copyButton, viewButton, viewSettings, readId, readGroups, clickShowMore, chooseView };
}

describe("createFavoriteLightboxDetails", () => {
  test("styles every class it sets", () => {
    expectClassesStyled(FavoriteLightboxDetailsClass, LIGHTBOX_DETAILS_CSS);
  });

  test("shows the shown favorite's id and follows it", () => {
    const { favorite, readId } = setup(createFavorite("12"));

    expect(readId()).toBe("12");
    favorite.value = createFavorite("34");
    expect(readId()).toBe("34");
  });

  test("copies the shown favorite's id", async() => {
    const { clipboard, copyButton } = setup(createFavorite("12"));

    copyButton.click();
    await flushMicrotasks();
    expect(clipboard.text).toBe("12");
  });

  test("shows nothing without a favorite", async() => {
    const { readId, readGroups } = setup(undefined);

    await flushMicrotasks();
    expect([readId(), readGroups()]).toEqual(["", []]);
  });

  test("groups the favorite's tags under their saved categories", async() => {
    const { readGroups } = setup(createFavorite("1", ["solo", "alice", "tracer"]), new Map([["alice", "artist"], ["tracer", "character"]]));

    await flushMicrotasks();
    expect(readGroups()).toEqual([["Artist", "alice"], ["Character", "tracer"], ["General", "solo"]]);
  });

  test("shows six tags of a longer group until asked for the rest", async() => {
    const { readGroups, clickShowMore } = setup(createFavorite("1", ["a", "b", "c", "d", "e", "f", "g", "h"]));

    await flushMicrotasks();
    expect(readGroups()).toEqual([["General", "a", "b", "c", "d", "e", "f", "Show 2 more"]]);
    clickShowMore();
    expect(readGroups()).toEqual([["General", "a", "b", "c", "d", "e", "f", "g", "h"]]);
  });

  test("collapses an expanded group again for the next favorite", async() => {
    const tags = ["a", "b", "c", "d", "e", "f", "g"];
    const { favorite, readGroups, clickShowMore } = setup(createFavorite("1", tags));

    await flushMicrotasks();
    clickShowMore();
    favorite.value = createFavorite("2", tags);
    await flushMicrotasks();
    expect(readGroups()).toEqual([["General", "a", "b", "c", "d", "e", "f", "Show 1 more"]]);
  });

  test("shows a newer favorite's tags when an older lookup resolves late", async() => {
    const { favorite, getMany, readGroups } = setup(undefined);
    let resolveLate: (categories: Map<string, TagCategory>) => void = () => undefined;

    getMany.mockReturnValueOnce(new Promise(resolve => {
      resolveLate = resolve;
    }));
    favorite.value = createFavorite("1", ["stale"]);
    favorite.value = createFavorite("2", ["fresh"]);
    await flushMicrotasks();
    resolveLate(new Map());
    await flushMicrotasks();

    expect(readGroups()).toEqual([["General", "fresh"]]);
  });

  test("shows every tag under general when the lookup fails", async() => {
    const { favorite, getMany, readGroups } = setup(undefined);

    vi.spyOn(console, "error").mockImplementation(() => undefined);
    getMany.mockRejectedValueOnce(new Error("blocked"));
    favorite.value = createFavorite("1", ["solo"]);
    await flushMicrotasks();

    expect(readGroups()).toEqual([["General", "solo"]]);
  });

  test("opens and closes the view settings from the settings button", () => {
    const { viewButton, viewSettings } = setup(createFavorite("1"));

    expect(viewSettings.hidden).toBe(true);
    viewButton.click();
    expect([viewSettings.hidden, viewButton.getAttribute("aria-pressed")]).toEqual([false, "true"]);
    viewButton.click();
    expect(viewSettings.hidden).toBe(true);
  });

  test("shows every tag in one alphabetical list without headings when chosen", async() => {
    const { view, readGroups, chooseView } = setup(createFavorite("1", ["solo", "alice", "b", "c", "d", "e", "f"]), new Map([["alice", "artist"]]));

    await flushMicrotasks();
    chooseView("One list");
    expect(view.organization.value).toBe("list");
    expect(readGroups()).toEqual([["alice", "b", "c", "d", "e", "f", "solo"]]);
  });

  test("remembers the chosen alignment and size", () => {
    const { view, chooseView } = setup(createFavorite("1"));

    chooseView("Centered");
    chooseView("Large");
    expect([view.alignment.value, view.size.value]).toEqual(["center", "large"]);
  });
});
