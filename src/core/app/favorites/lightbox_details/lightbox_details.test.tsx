import { describe, expect, test } from "vitest";
import { h, render } from "@/core/ui/h/h";
import { Favorite } from "@/core/features/favorites/favorite";
import { FavoriteLightboxDetails } from "@/core/app/favorites/lightbox_details/lightbox_details";
import { Signal } from "@/core/utils/reactive/signal";

describe("FavoriteLightboxDetails", () => {
  test("shows the shown favorite's id and follows it", () => {
    const favorite = new Signal<Pick<Favorite, "id"> | undefined>({ id: "12" });
    const { result } = render(document, () => <FavoriteLightboxDetails favorite={favorite} /> as HTMLElement);

    expect(result.textContent).toBe("#12");
    favorite.value = { id: "34" };
    expect(result.textContent).toBe("#34");
  });

  test("shows nothing without a favorite", () => {
    const { result } = render(document, () => <FavoriteLightboxDetails favorite={new Signal(undefined)} /> as HTMLElement);

    expect(result.textContent).toBe("");
  });
});
