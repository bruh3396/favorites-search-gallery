import { FavoriteLightboxDetails, FavoriteLightboxDetailsClass } from "@/core/app/favorites/lightbox_details/lightbox_details";
import { describe, expect, test, vi } from "vitest";
import { h, render } from "@/core/ui/h/h";
import { Favorite } from "@/core/features/favorites/favorite";
import { MemoryClipboard } from "@/adapters/memory/ports/clipboard/clipboard";
import { MemoryScheduler } from "@/adapters/memory/ports/scheduler/scheduler";
import { Signal } from "@/core/utils/reactive/signal";
import { TagCategory } from "@/core/domain/tag/tag";
import { flushMicrotasks } from "@/testing/async";

type ShownFavorite = Pick<Favorite, "id" | "tags">;

function createFavorite(id: string, tags: readonly string[] = []): ShownFavorite {
  return { id, tags: new Set(tags) };
}

function setup(initial: ShownFavorite | undefined, categories: ReadonlyMap<string, TagCategory> = new Map()) {
  const favorite = new Signal<ShownFavorite | undefined>(initial);
  const getMany = vi.fn((names: readonly string[]) => Promise.resolve(new Map(names.flatMap(name => {
    const category = categories.get(name);
    return category === undefined ? [] : [[name, category] as const];
  }))));
  const clipboard = new MemoryClipboard();
  const { result } = render(document, () => (
    <FavoriteLightboxDetails favorite={favorite} localTagCategories={{ getMany }} clipboard={clipboard} scheduler={new MemoryScheduler()} />
  ) as HTMLElement);
  const copyButton = result.querySelector<HTMLButtonElement>("button")!;
  const readId = (): string => copyButton.firstChild?.textContent ?? "";
  const readGroups = (): string[][] => [...result.querySelectorAll(`.${FavoriteLightboxDetailsClass.group}`)]
    .map(group => [...group.querySelectorAll("h3, li")].map(element => element.textContent ?? ""));
  return { favorite, getMany, clipboard, copyButton, readId, readGroups };
}

describe("FavoriteLightboxDetails", () => {
  test("shows the shown favorite's id and follows it", () => {
    const { favorite, readId } = setup(createFavorite("12"));

    expect(readId()).toBe("#12");
    favorite.value = createFavorite("34");
    expect(readId()).toBe("#34");
  });

  test("shows nothing without a favorite", async() => {
    const { readId, readGroups } = setup(undefined);

    await flushMicrotasks();
    expect(readId()).toBe("");
    expect(readGroups()).toEqual([]);
  });

  test("groups the favorite's tags under their saved categories", async() => {
    const { readGroups } = setup(createFavorite("1", ["solo", "alice", "tracer"]), new Map([["alice", "artist"], ["tracer", "character"]]));

    await flushMicrotasks();
    expect(readGroups()).toEqual([["Artist", "alice"], ["Character", "tracer"], ["General", "solo"]]);
  });

  test("shows a newer favorite's tags when an older lookup resolves late", async() => {
    const { favorite, getMany, readGroups } = setup(undefined);
    let resolveLate = (_categories: Map<string, TagCategory>): void => undefined;

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

  test("copies the shown favorite's id", async() => {
    const { clipboard, copyButton } = setup(createFavorite("12"));

    copyButton.click();
    await flushMicrotasks();
    expect(clipboard.text).toBe("12");
  });
});
