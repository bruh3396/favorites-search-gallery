import { FavoriteHeart, FavoriteHeartClass } from "@/core/ui/components/heart/heart";
import { describe, expect, test, vi } from "vitest";
import { h, render } from "@/core/ui/h/h";
import HEARTS_CSS from "@/core/ui/components/heart/heart.css?inline";
import { Signal } from "@/core/utils/reactive/signal";
import { expectClassesStyled } from "@/testing/css";

interface Setup {
  heart: HTMLElement;
  favorited: Record<string, Signal<boolean>>;
  addFavorite: (id: string) => void;
  removeFavorite: (id: string) => void;
  dispose: () => void;
}

function setup(removedIds: string[] = []): Setup {
  const favorited: Record<string, Signal<boolean>> = {
    1: new Signal(!removedIds.includes("1")),
    2: new Signal(!removedIds.includes("2"))
  };
  const options = { addFavorite: vi.fn(), removeFavorite: vi.fn() };
  const { result: heart, dispose } = render(document, () => (
    <FavoriteHeart id="1" isFavorited={id => favorited[id].value} {...options} />
  ));
  return { ...options, favorited, heart, dispose };
}

describe("FavoriteHeart", () => {
  test("draws a labelled, pressed heart for a favorite", () => {
    const { heart } = setup();

    expect(heart.getAttribute("aria-label")).toBe("Favorite");
    expect(heart.getAttribute("aria-pressed")).toBe("true");
  });

  test("draws an unpressed heart for a favorite removed earlier", () => {
    expect(setup(["1"]).heart.getAttribute("aria-pressed")).toBe("false");
  });

  test("removes a favorite when clicked", () => {
    const { heart, addFavorite, removeFavorite } = setup();

    heart.click();
    expect(removeFavorite).toHaveBeenCalledExactlyOnceWith("1");
    expect(addFavorite).not.toHaveBeenCalled();
  });

  test("adds a removed favorite back when clicked", () => {
    const { heart, addFavorite } = setup(["1"]);

    heart.click();
    expect(addFavorite).toHaveBeenCalledExactlyOnceWith("1");
  });

  test("stays pressed until the removal goes through", () => {
    const { heart, favorited } = setup();

    heart.click();
    expect(heart.getAttribute("aria-pressed")).toBe("true");
    favorited[1].value = false;
    expect(heart.getAttribute("aria-pressed")).toBe("false");
  });

  test("ignores changes to other favorites", () => {
    const { heart, favorited } = setup();

    favorited[2].value = false;
    expect(heart.getAttribute("aria-pressed")).toBe("true");
  });

  test("stops following changes once disposed", () => {
    const { heart, favorited, dispose } = setup();

    dispose();
    favorited[1].value = false;
    expect(heart.getAttribute("aria-pressed")).toBe("true");
  });

  test("styles every class it sets", () => {
    expectClassesStyled(FavoriteHeartClass, HEARTS_CSS);
  });
});
