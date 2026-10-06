import { FavoriteHeart, FavoriteHeartClass } from "@/core/features/favorites/ui/hearts/hearts";
import { describe, expect, test, vi } from "vitest";
import { h, render } from "@/core/ui/h/h";
import HEARTS_CSS from "@/core/features/favorites/ui/hearts/hearts.css?inline";
import { Signal } from "@/core/utils/reactive/signal";
import { expectClassesStyled } from "@/testing/css";

interface Setup {
  heart: HTMLElement;
  favoritedById: Signal<ReadonlyMap<string, boolean>>;
  addFavorite: (id: string) => void;
  removeFavorite: (id: string) => void;
  dispose: () => void;
}

function setup(changes: [string, boolean][] = []): Setup {
  const options = {
    favoritedById: new Signal<ReadonlyMap<string, boolean>>(new Map(changes)),
    addFavorite: vi.fn(),
    removeFavorite: vi.fn()
  };
  const { result: heart, dispose } = render(document, () => <FavoriteHeart id="1" {...options} />);
  return { ...options, heart, dispose };
}

describe("FavoriteHeart", () => {
  test("draws a labelled, pressed heart for a favorite", () => {
    const { heart } = setup();

    expect(heart.getAttribute("aria-label")).toBe("Favorite");
    expect(heart.getAttribute("aria-pressed")).toBe("true");
  });

  test("draws an unpressed heart for a favorite removed earlier", () => {
    expect(setup([["1", false]]).heart.getAttribute("aria-pressed")).toBe("false");
  });

  test("removes a favorite when clicked", () => {
    const { heart, addFavorite, removeFavorite } = setup();

    heart.click();
    expect(removeFavorite).toHaveBeenCalledExactlyOnceWith("1");
    expect(addFavorite).not.toHaveBeenCalled();
  });

  test("adds a removed favorite back when clicked", () => {
    const { heart, addFavorite } = setup([["1", false]]);

    heart.click();
    expect(addFavorite).toHaveBeenCalledExactlyOnceWith("1");
  });

  test("stays pressed until the removal goes through", () => {
    const { heart, favoritedById } = setup();

    heart.click();
    expect(heart.getAttribute("aria-pressed")).toBe("true");
    favoritedById.value = new Map([["1", false]]);
    expect(heart.getAttribute("aria-pressed")).toBe("false");
  });

  test("ignores changes to other favorites", () => {
    const { heart, favoritedById } = setup();

    favoritedById.value = new Map([["2", false]]);
    expect(heart.getAttribute("aria-pressed")).toBe("true");
  });

  test("stops following changes once disposed", () => {
    const { heart, favoritedById, dispose } = setup();

    dispose();
    favoritedById.value = new Map([["1", false]]);
    expect(heart.getAttribute("aria-pressed")).toBe("true");
  });

  test("styles every class it sets", () => {
    expectClassesStyled(FavoriteHeartClass, HEARTS_CSS);
  });
});
