import { FavoriteLightboxTags, FavoriteLightboxTagsClass } from "@/core/app/favorites/lightbox/favorite_lightbox_tags";
import { Mock, describe, expect, test, vi } from "vitest";
import { h, render } from "@/core/ui/h/h";
import { Favorite } from "@/core/features/favorites/favorite";
import LIGHTBOX_TAGS_CSS from "@/core/app/favorites/lightbox/favorite_lightbox_tags.css?inline";
import { Signal } from "@/core/utils/reactive/signal";
import { TagAlignment } from "@/core/app/favorites/lightbox/tag_alignment";
import { TagCategory } from "@/core/domain/tag_category/tag_category";
import { TagOrganization } from "@/core/app/favorites/lightbox/tag_organization";
import { TagSize } from "@/core/app/favorites/lightbox/tag_size";
import { expectClassesStyled } from "@/testing/css_utilities";
import { flushMicrotasks } from "@/testing/microtask_utilities";

type ShownFavorite = Pick<Favorite, "tags">;

function createFavorite(tags: readonly string[] = []): ShownFavorite {
  return { tags: new Set(tags) };
}

interface Setup {
  element: HTMLElement;
  favorite: Signal<ShownFavorite | undefined>;
  organization: Signal<TagOrganization>;
  alignment: Signal<TagAlignment>;
  size: Signal<TagSize>;
  getMany: Mock<(names: readonly string[]) => Promise<Map<string, TagCategory>>>;
  readGroups: () => string[][];
  clickShowMore: () => void;
  dispose: () => void;
}

function setup(shownFavorite: ShownFavorite | undefined, categories: ReadonlyMap<string, TagCategory> = new Map()): Setup {
  const favorite = new Signal<ShownFavorite | undefined>(shownFavorite);
  const organization = new Signal<TagOrganization>("category");
  const alignment = new Signal<TagAlignment>("start");
  const size = new Signal<TagSize>("medium");
  const getMany = vi.fn((names: readonly string[]) => Promise.resolve(new Map(names.flatMap(name => {
    const category = categories.get(name);
    return category === undefined ? [] : [[name, category] as const];
  }))));
  const { result: element, dispose } = render(document, () => (
    <FavoriteLightboxTags
      favorite={favorite}
      organization={organization}
      alignment={alignment}
      size={size}
      localTagCategories={{ getMany }}
      collapsedTagCount={6}
    />
  ));
  const readGroups = (): string[][] => [...element.querySelectorAll(`.${FavoriteLightboxTagsClass.group}`)]
    .map(group => [...group.querySelectorAll<HTMLElement>("h3, li:not([hidden])")].map(item => item.textContent ?? ""));
  const clickShowMore = (): void => element.querySelector<HTMLButtonElement>(`.${FavoriteLightboxTagsClass.showMore}`)!.click();
  return { element, favorite, organization, alignment, size, getMany, readGroups, clickShowMore, dispose };
}

describe("FavoriteLightboxTags", () => {
  test("styles every class it sets", () => {
    expectClassesStyled(FavoriteLightboxTagsClass, LIGHTBOX_TAGS_CSS);
  });

  test("shows nothing without a favorite", async() => {
    const { readGroups } = setup(undefined);

    await flushMicrotasks();
    expect(readGroups()).toEqual([]);
  });

  test("groups the favorite's tags under their saved categories", async() => {
    const { readGroups } = setup(createFavorite(["solo", "alice", "tracer"]), new Map([["alice", "artist"], ["tracer", "character"]]));

    await flushMicrotasks();
    expect(readGroups()).toEqual([["Artist", "alice"], ["Character", "tracer"], ["General", "solo"]]);
  });

  test("orders groups artist, character, copyright, meta, general", async() => {
    const categories = new Map<string, TagCategory>([
      ["highres", "metadata"],
      ["solo", "general"],
      ["overwatch", "copyright"],
      ["tracer", "character"],
      ["alice", "artist"]
    ]);
    const { readGroups } = setup(createFavorite([...categories.keys()]), categories);

    await flushMicrotasks();
    expect(readGroups().map(([heading]) => heading)).toEqual(["Artist", "Character", "Copyright", "Meta", "General"]);
  });

  test("sorts tags alphabetically within a group", async() => {
    const { readGroups } = setup(createFavorite(["solo", "blonde", "smile"]));

    await flushMicrotasks();
    expect(readGroups()).toEqual([["General", "blonde", "smile", "solo"]]);
  });

  test("puts uncategorized and unknown tags under general", async() => {
    const { readGroups } = setup(createFavorite(["mystery", "unsaved"]), new Map([["mystery", "unknown"]]));

    await flushMicrotasks();
    expect(readGroups()).toEqual([["General", "mystery", "unsaved"]]);
  });

  test("shows no groups for a favorite without tags", async() => {
    const { readGroups } = setup(createFavorite());

    await flushMicrotasks();
    expect(readGroups()).toEqual([]);
  });

  test("shows six tags of a longer group until asked for the rest", async() => {
    const { readGroups, clickShowMore } = setup(createFavorite(["a", "b", "c", "d", "e", "f", "g", "h"]));

    await flushMicrotasks();
    expect(readGroups()).toEqual([["General", "a", "b", "c", "d", "e", "f", "Show 2 more"]]);
    clickShowMore();
    expect(readGroups()).toEqual([["General", "a", "b", "c", "d", "e", "f", "g", "h"]]);
  });

  test("collapses an expanded group again for the next favorite", async() => {
    const tags = ["a", "b", "c", "d", "e", "f", "g"];
    const { favorite, readGroups, clickShowMore } = setup(createFavorite(tags));

    await flushMicrotasks();
    clickShowMore();
    favorite.value = createFavorite(tags);
    await flushMicrotasks();
    expect(readGroups()).toEqual([["General", "a", "b", "c", "d", "e", "f", "Show 1 more"]]);
  });

  test("shows a newer favorite's tags when an older lookup resolves late", async() => {
    const { favorite, getMany, readGroups } = setup(undefined);
    let resolveLate: (categories: Map<string, TagCategory>) => void = () => undefined;

    getMany.mockReturnValueOnce(new Promise(resolve => {
      resolveLate = resolve;
    }));
    favorite.value = createFavorite(["stale"]);
    favorite.value = createFavorite(["fresh"]);
    await flushMicrotasks();
    resolveLate(new Map());
    await flushMicrotasks();

    expect(readGroups()).toEqual([["General", "fresh"]]);
  });

  test("shows every tag under general when the lookup fails", async() => {
    const { favorite, getMany, readGroups } = setup(undefined);

    vi.spyOn(console, "error").mockImplementation(() => undefined);
    getMany.mockRejectedValueOnce(new Error("blocked"));
    favorite.value = createFavorite(["solo"]);
    await flushMicrotasks();

    expect(readGroups()).toEqual([["General", "solo"]]);
  });

  test("shows every tag in one alphabetical list without headings in list organization", async() => {
    const { organization, readGroups } = setup(createFavorite(["solo", "alice", "b", "c", "d", "e", "f"]), new Map([["alice", "artist"]]));

    await flushMicrotasks();
    organization.value = "list";
    expect(readGroups()).toEqual([["alice", "b", "c", "d", "e", "f", "solo"]]);
  });

  test("stops expanding groups once disposed", async() => {
    const { readGroups, clickShowMore, dispose } = setup(createFavorite(["a", "b", "c", "d", "e", "f", "g"]));

    await flushMicrotasks();
    dispose();
    clickShowMore();
    expect(readGroups()).toEqual([["General", "a", "b", "c", "d", "e", "f", "Show 1 more"]]);
  });

  test("exposes its alignment and size for styling", () => {
    const { element, alignment, size } = setup(undefined);

    alignment.value = "center";
    size.value = "large";
    expect([element.dataset.alignment, element.dataset.size]).toEqual(["center", "large"]);
  });
});
