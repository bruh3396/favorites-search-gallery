import { FavoriteLightboxDetailsClass, FavoriteLightboxDetailsView, createFavoriteLightboxDetails } from "@/core/app/favorites/lightbox/favorite_lightbox_details";
import { describe, expect, test } from "vitest";
import { h, render } from "@/core/ui/h/h";
import { APP_STORAGE_SCHEMA } from "@/core/app/app_storage_schema";
import { Favorite } from "@/core/features/favorites/favorite";
import { FavoriteLightboxTagsClass } from "@/core/app/favorites/lightbox/favorite_lightbox_tags";
import LIGHTBOX_DETAILS_CSS from "@/core/app/favorites/lightbox/favorite_lightbox_details.css?inline";
import { MemoryClipboard } from "@/adapters/memory/ports/clipboard/memory_clipboard";
import { MemoryLocalKeyedValues } from "@/adapters/memory/ports/local_keyed_values/memory_local_keyed_values";
import { MemoryScheduler } from "@/adapters/memory/ports/scheduler/memory_scheduler";
import { Signal } from "@/core/utils/reactive/signal";
import { createStoredTree } from "@/core/utils/stored_value/stored_tree";
import { expectClassesStyled } from "@/testing/css";
import { flushMicrotasks } from "@/testing/async";

type ShownFavorite = Pick<Favorite, "id" | "tags">;

function createFavorite(id: string, tags: readonly string[] = []): ShownFavorite {
  return { id, tags: new Set(tags) };
}

interface Setup {
  element: HTMLElement;
  favorite: Signal<ShownFavorite | undefined>;
  clipboard: MemoryClipboard;
  view: FavoriteLightboxDetailsView;
  copyButton: HTMLButtonElement;
  viewButton: HTMLButtonElement;
  viewSettings: HTMLElement;
  readId: () => string;
  chooseView: (label: string) => void;
}

function setup(initial: ShownFavorite | undefined): Setup {
  const favorite = new Signal<ShownFavorite | undefined>(initial);
  const clipboard = new MemoryClipboard();
  const view = createStoredTree(APP_STORAGE_SCHEMA.preferences, new MemoryLocalKeyedValues(), ["favorites"]).favorites.lightbox.details;
  const { result: element } = render(document, () => {
    const { title, controls, body } = createFavoriteLightboxDetails({
      favorite, view, localTagCategories: { getMany: () => Promise.resolve(new Map()) }, clipboard, scheduler: new MemoryScheduler(), copiedDuration: 1_500, collapsedTagCount: 6
    });
    return <div>{title}{controls}{body}</div> as HTMLElement;
  });
  const copyButton = element.querySelector<HTMLButtonElement>(`.${FavoriteLightboxDetailsClass.id} button`)!;
  const viewButton = element.querySelector<HTMLButtonElement>("[aria-label=\"View settings\"]")!;
  const viewSettings = element.querySelector<HTMLElement>(`.${FavoriteLightboxDetailsClass.view}`)!;
  const readId = (): string => copyButton.firstChild?.textContent ?? "";
  const chooseView = (label: string): void => [...viewSettings.querySelectorAll<HTMLButtonElement>("button")]
    .find(button => button.getAttribute("aria-label") === label)!.click();
  return { element, favorite, clipboard, view, copyButton, viewButton, viewSettings, readId, chooseView };
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

  test("shows no id without a favorite", () => {
    const { readId } = setup(undefined);

    expect(readId()).toBe("");
  });

  test("shows the favorite's tags in its body", async() => {
    const { element } = setup(createFavorite("1", ["solo"]));

    await flushMicrotasks();
    expect(element.querySelector(`.${FavoriteLightboxTagsClass.tag}`)!.textContent).toBe("solo");
  });

  test("opens and closes the view settings from the settings button", () => {
    const { viewButton, viewSettings } = setup(createFavorite("1"));

    expect(viewSettings.hidden).toBe(true);
    viewButton.click();
    expect([viewSettings.hidden, viewButton.getAttribute("aria-pressed")]).toEqual([false, "true"]);
    viewButton.click();
    expect(viewSettings.hidden).toBe(true);
  });

  test("remembers the chosen view and shows the tags in it", () => {
    const { element, view, chooseView } = setup(createFavorite("1"));
    const tags = element.querySelector<HTMLElement>(`.${FavoriteLightboxTagsClass.root}`)!;

    chooseView("One list");
    chooseView("Centered");
    chooseView("Large");
    expect([view.organization.value, view.alignment.value, view.size.value]).toEqual(["list", "center", "large"]);
    expect([tags.dataset.alignment, tags.dataset.size]).toEqual(["center", "large"]);
  });
});
