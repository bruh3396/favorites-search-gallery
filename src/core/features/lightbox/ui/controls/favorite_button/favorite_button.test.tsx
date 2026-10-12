import { describe, expect, onTestFinished, test } from "vitest";
import { h, render } from "@/core/ui/h/h";
import { LightboxFavoriteButton } from "@/core/features/lightbox/ui/controls/favorite_button/favorite_button";
import { Signal } from "@/core/utils/reactive/signal";

interface Setup {
  button: HTMLButtonElement;
  current: Signal<string | undefined>;
  favorited: Signal<ReadonlySet<string>>;
}

function setup(): Setup {
  const current = new Signal<string | undefined>("1");
  const favorited = new Signal<ReadonlySet<string>>(new Set(["1"]));
  const { result, dispose } = render(document, () => (
    <LightboxFavoriteButton
      current={current}
      isFavorited={item => favorited.value.has(item)}
      addFavorite={item => {
        favorited.value = new Set([...favorited.peek(), item]);
      }}
      removeFavorite={item => {
        favorited.value = new Set([...favorited.peek()].filter(id => id !== item));
      }}
    />
  ));

  onTestFinished(dispose);
  return { button: result as HTMLButtonElement, current, favorited };
}

describe("LightboxFavoriteButton", () => {
  test("shows whether the shown item is favorited", () => {
    const { button, current } = setup();
    const pressed = [button.getAttribute("aria-pressed")];

    current.value = "2";
    pressed.push(button.getAttribute("aria-pressed"));
    current.value = undefined;
    pressed.push(button.getAttribute("aria-pressed"));
    expect(pressed).toEqual(["true", "false", "false"]);
  });

  test("removes a favorited item and adds it back", () => {
    const { button, favorited } = setup();

    button.click();
    expect([favorited.peek().has("1"), button.getAttribute("aria-pressed")]).toEqual([false, "false"]);
    button.click();
    expect([favorited.peek().has("1"), button.getAttribute("aria-pressed")]).toEqual([true, "true"]);
  });

  test("does nothing when no item is shown", () => {
    const { button, current, favorited } = setup();

    current.value = undefined;
    button.click();
    expect([...favorited.peek()]).toEqual(["1"]);
  });
});
