import { describe, expect, test } from "vitest";
import { h, render } from "@/core/ui/h/h";
import { APP_STORAGE_SCHEMA } from "@/core/app/app_storage_schema";
import { CopyIdButtonClass } from "@/core/app/favorites/lightbox/copy_id_button";
import { Favorite } from "@/core/features/favorites/favorite";
import { FavoriteLightboxDetailsClass } from "@/core/app/favorites/lightbox/favorite_lightbox_details";
import { FavoriteLightboxTagsClass } from "@/core/app/favorites/lightbox/favorite_lightbox_tags";
import { MemoryClipboard } from "@/adapters/memory/ports/clipboard/memory_clipboard";
import { MemoryLocalKeyedValues } from "@/adapters/memory/ports/local_keyed_values/memory_local_keyed_values";
import { MemoryScheduler } from "@/adapters/memory/ports/scheduler/memory_scheduler";
import { Signal } from "@/core/utils/reactive/signal";
import { composeFavoriteLightboxDetails } from "@/core/app/favorites/lightbox/favorite_lightbox_details_composer";
import { createStoredTree } from "@/core/utils/storage/stored_tree";
import { flushMicrotasks } from "@/testing/microtask_utilities";

type ShownFavorite = Pick<Favorite, "id" | "tags">;

interface Setup {
  favorite: Signal<ShownFavorite | undefined>;
  clipboard: MemoryClipboard;
  copyIdButton: HTMLButtonElement;
  readTags: () => string[];
}

function setup(shownFavorite: ShownFavorite): Setup {
  const favorite = new Signal<ShownFavorite | undefined>(shownFavorite);
  const clipboard = new MemoryClipboard();
  const preferences = createStoredTree(APP_STORAGE_SCHEMA.preferences, new MemoryLocalKeyedValues(), ["favorites"]).favorites.lightbox.details;
  const { result: element } = render(document, () => {
    const { titleChild, bodyChild } = composeFavoriteLightboxDetails(favorite, {
      preferences,
      clipboard,
      scheduler: new MemoryScheduler(),
      localTagCategories: { getMany: () => Promise.resolve(new Map()) }
    });
    return h("div", {}, titleChild, bodyChild) as HTMLElement;
  });
  const copyIdButton = element.querySelector<HTMLButtonElement>(`.${FavoriteLightboxDetailsClass.id} .${CopyIdButtonClass.root}`)!;
  const readTags = (): string[] => [...element.querySelectorAll<HTMLElement>(`.${FavoriteLightboxTagsClass.root} li:not([hidden])`)]
    .map(tag => tag.textContent ?? "");
  return { favorite, clipboard, copyIdButton, readTags };
}

describe("composeFavoriteLightboxDetails", () => {
  test("copies the current favorite's id from its title", async() => {
    const { favorite, clipboard, copyIdButton } = setup({ id: "12", tags: new Set() });

    favorite.value = { id: "34", tags: new Set() };
    copyIdButton.click();
    await flushMicrotasks();
    expect(clipboard.text).toBe("34");
  });

  test("shows the current favorite's tags in its body", async() => {
    const { readTags } = setup({ id: "12", tags: new Set(["solo"]) });

    await flushMicrotasks();
    expect(readTags()).toEqual(["solo"]);
  });
});
