import { AppMark, AppMarkClass } from "@/core/ui/app_mark/app_mark";
import { describe, expect, test } from "vitest";
import { h, render } from "@/core/ui/h/h";
import APP_MARK_CSS from "@/core/ui/app_mark/app_mark.css?inline";
import { expectClassesStyled } from "@/testing/css_utilities";

describe("AppMark", () => {
  test("styles every class it sets", () => {
    expectClassesStyled(AppMarkClass, APP_MARK_CSS);
  });

  test("shows the version", () => {
    const { result: element } = render(document, () => <AppMark scriptVersion="2.0.0" />);

    expect(element.textContent).toBe("2.0.0");
  });

  test("names the script and its version to assistive technology and in a tooltip", () => {
    const { result: element } = render(document, () => <AppMark scriptVersion="2.0.0" />);

    expect([element.getAttribute("role"), element.getAttribute("aria-label"), element.title])
      .toEqual(["img", "Favorites Search Gallery 2.0.0", "Favorites Search Gallery 2.0.0"]);
  });

  test("shows a pre-release version without its suffix, keeping it in the tooltip", () => {
    const { result: element } = render(document, () => <AppMark scriptVersion="1.23.2-dev" />);

    expect([element.textContent, element.title]).toEqual(["1.23.2", "Favorites Search Gallery 1.23.2-dev"]);
  });
});
