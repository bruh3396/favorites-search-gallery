import { AppMark, AppMarkClass } from "@/core/ui/app_mark/app_mark";
import { describe, expect, test, vi } from "vitest";
import { h, render } from "@/core/ui/h/h";
import APP_MARK_CSS from "@/core/ui/app_mark/app_mark.css?inline";
import { ContextMenuItem } from "@/core/ui/components/context_menu/context_menu_item";
import { expectClassesStyled } from "@/testing/css_utilities";

function setup(scriptVersion = "2.0.0", contextMenuItems: readonly ContextMenuItem[] = []): HTMLButtonElement {
  const container = document.createElement("div");

  document.body.replaceChildren(container);
  container.append(render(document, () => <AppMark scriptVersion={scriptVersion} contextMenuItems={contextMenuItems} />).result);
  return container.querySelector("button")!;
}

describe("AppMark", () => {
  test("styles every class it sets", () => {
    expectClassesStyled(AppMarkClass, APP_MARK_CSS);
  });

  test("shows the version", () => {
    expect(setup().textContent).toBe("2.0.0");
  });

  test("names the script and its version to assistive technology and in a tooltip", () => {
    const button = setup();

    expect([button.getAttribute("aria-label"), button.title]).toEqual(["Favorites Search Gallery 2.0.0", "Favorites Search Gallery 2.0.0"]);
  });

  test("shows a pre-release version without its suffix, keeping it in the tooltip", () => {
    const button = setup("1.23.2-dev");

    expect([button.textContent, button.title]).toEqual(["1.23.2", "Favorites Search Gallery 1.23.2-dev"]);
  });

  test("opens its menu when clicked", () => {
    const onChoose = vi.fn<() => void>();

    setup("2.0.0", [{ label: "Changelog", onChoose }]).click();
    document.querySelector<HTMLElement>("[role='menuitem']")!.click();
    expect(onChoose).toHaveBeenCalledOnce();
  });
});
