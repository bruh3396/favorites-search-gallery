import { FavoriteHeartClass, FavoriteHearts, createFavoriteHearts } from "@/core/features/favorites/ui/hearts/hearts";
import { describe, expect, test, vi } from "vitest";
import HEARTS_CSS from "@/core/features/favorites/ui/hearts/hearts.css?inline";
import { Signal } from "@/core/utils/reactive/signal";
import { expectClassesStyled } from "@/testing/css";

interface Setup extends FavoriteHearts {
  container: HTMLElement;
  favoritedChanges: Signal<ReadonlyMap<string, boolean>>;
  addFavorite: (id: string) => void;
  removeFavorite: (id: string) => void;
}

function setup(changes: [string, boolean][] = []): Setup {
  const options = {
    container: document.createElement("div"),
    favoritedChanges: new Signal<ReadonlyMap<string, boolean>>(new Map(changes)),
    addFavorite: vi.fn(),
    removeFavorite: vi.fn()
  };
  return { ...createFavoriteHearts(document, options), ...options };
}

function appendHeart({ container, createHeart }: Setup, id: string): HTMLButtonElement {
  const heart = createHeart(id);

  container.append(heart);
  return heart;
}

describe("createFavoriteHearts", () => {
  test("draws a labelled, pressed heart for a favorite", () => {
    const heart = appendHeart(setup(), "1");

    expect(heart.getAttribute("aria-label")).toBe("Favorite");
    expect(heart.getAttribute("aria-pressed")).toBe("true");
  });

  test("draws an unpressed heart for a favorite removed earlier", () => {
    expect(appendHeart(setup([["1", false]]), "1").getAttribute("aria-pressed")).toBe("false");
  });

  test("removes a favorite when its heart is clicked", () => {
    const hearts = setup();

    appendHeart(hearts, "1").click();
    expect(hearts.removeFavorite).toHaveBeenCalledExactlyOnceWith("1");
    expect(hearts.addFavorite).not.toHaveBeenCalled();
  });

  test("adds a removed favorite back when its heart is clicked", () => {
    const hearts = setup([["1", false]]);

    appendHeart(hearts, "1").click();
    expect(hearts.addFavorite).toHaveBeenCalledExactlyOnceWith("1");
  });

  test("keeps the heart pressed until the removal goes through", () => {
    const hearts = setup();
    const heart = appendHeart(hearts, "1");

    heart.click();
    expect(heart.getAttribute("aria-pressed")).toBe("true");
    hearts.favoritedChanges.value = new Map([["1", false]]);
    expect(heart.getAttribute("aria-pressed")).toBe("false");
  });

  test("stops following changes and clicks once disposed", () => {
    const hearts = setup();
    const heart = appendHeart(hearts, "1");

    hearts.dispose();
    hearts.favoritedChanges.value = new Map([["1", false]]);
    heart.click();
    expect(heart.getAttribute("aria-pressed")).toBe("true");
    expect(hearts.removeFavorite).not.toHaveBeenCalled();
  });

  test("styles every class it sets", () => {
    expectClassesStyled(FavoriteHeartClass, HEARTS_CSS);
  });
});
