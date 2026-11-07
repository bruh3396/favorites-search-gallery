import { FavoriteLightboxDetailsClass, FavoriteLightboxDetailsPreferences, createFavoriteLightboxDetails } from "@/core/app/favorites/lightbox/favorite_lightbox_details";
import { FavoriteLightboxTags, FavoriteLightboxTagsClass } from "@/core/app/favorites/lightbox/favorite_lightbox_tags";
import { describe, expect, test } from "vitest";
import { h, render } from "@/core/ui/h/h";
import { APP_STORAGE_SCHEMA } from "@/core/app/app_storage_schema";
import LIGHTBOX_DETAILS_CSS from "@/core/app/favorites/lightbox/favorite_lightbox_details.css?inline";
import { MemoryLocalKeyedValues } from "@/adapters/memory/ports/local_keyed_values/memory_local_keyed_values";
import { Signal } from "@/core/utils/reactive/signal";
import { createStoredTree } from "@/core/utils/storage/stored_tree";
import { expectClassesStyled } from "@/testing/css_utilities";

interface Setup {
  element: HTMLElement;
  favoriteLightboxDetailsPreferences: FavoriteLightboxDetailsPreferences;
  viewButton: HTMLButtonElement;
  viewSettings: HTMLElement;
  chooseView: (label: string) => void;
}

function setup(): Setup {
  const favoriteLightboxDetailsPreferences = createStoredTree(APP_STORAGE_SCHEMA.preferences, new MemoryLocalKeyedValues(), ["favorites"])
    .favorites.lightbox.details;
  const { result: element } = render(document, () => {
    const { titleChild, controlsChild, bodyChild } = createFavoriteLightboxDetails({
      preferences: favoriteLightboxDetailsPreferences,
      copyIdButton: <button type="button">copy id</button>,
      tags: <FavoriteLightboxTags
        favorite={new Signal(undefined)}
        {...favoriteLightboxDetailsPreferences}
        localTagCategories={{ getMany: () => Promise.resolve(new Map()) }}
        collapsedTagCount={6}
      />
    });
    return <div>{titleChild}{controlsChild}{bodyChild}</div> as HTMLElement;
  });
  const viewButton = element.querySelector<HTMLButtonElement>("[aria-label=\"View Settings\"]")!;
  const viewSettings = element.querySelector<HTMLElement>(`.${FavoriteLightboxDetailsClass.view}`)!;
  const chooseView = (label: string): void => [...viewSettings.querySelectorAll<HTMLButtonElement>("button")]
    .find(button => button.getAttribute("aria-label") === label)!.click();
  return { element, favoriteLightboxDetailsPreferences, viewButton, viewSettings, chooseView };
}

describe("createFavoriteLightboxDetails", () => {
  test("styles every class it sets", () => {
    expectClassesStyled(FavoriteLightboxDetailsClass, LIGHTBOX_DETAILS_CSS);
  });

  test("places the copy id button in its title", () => {
    const { element } = setup();

    expect(element.querySelector(`.${FavoriteLightboxDetailsClass.id}`)!.textContent).toBe("copy id");
  });

  test("places the tags in its body", () => {
    const { element } = setup();

    expect(element.querySelector(`.${FavoriteLightboxTagsClass.root}`)).not.toBeNull();
  });

  test("opens and closes the view settings from the settings button", () => {
    const { viewButton, viewSettings } = setup();

    expect(viewSettings.closest("[hidden]") !== null).toBe(true);
    viewButton.click();
    expect([viewSettings.closest("[hidden]") !== null, viewButton.getAttribute("aria-pressed")]).toEqual([false, "true"]);
    viewButton.click();
    expect(viewSettings.closest("[hidden]") !== null).toBe(true);
  });

  test("remembers the chosen view and shows the tags in it", () => {
    const { element, favoriteLightboxDetailsPreferences, chooseView } = setup();
    const tags = element.querySelector<HTMLElement>(`.${FavoriteLightboxTagsClass.root}`)!;

    chooseView("One List");
    chooseView("Centered");
    chooseView("Large");
    expect([
      favoriteLightboxDetailsPreferences.organization.value,
      favoriteLightboxDetailsPreferences.alignment.value,
      favoriteLightboxDetailsPreferences.size.value
    ]).toEqual(["list", "center", "large"]);
    expect([tags.dataset.alignment, tags.dataset.size]).toEqual(["center", "large"]);
  });
});
