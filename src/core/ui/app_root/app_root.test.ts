import { AppRootClass, mountAppRoot } from "@/core/ui/app_root/app_root";
import { describe, expect, test } from "vitest";
import TOKENS_CSS from "@/core/ui/tokens.css?inline";
import { expectClassesStyled } from "@/testing/css";

describe("mountAppRoot", () => {
  test("mounts the root inside a shadow root on the container", () => {
    const container = document.createElement("div");
    const root = mountAppRoot(container, { colorScheme: "dark", styles: [] });

    expect(container.shadowRoot?.firstElementChild).toBe(root);
    expect(root.className).toBe(AppRootClass.root);
  });

  test("applies the color scheme to the root", () => {
    const root = mountAppRoot(document.createElement("div"), { colorScheme: "light", styles: [] });

    expect(root.style.colorScheme).toBe("light");
  });

  test("adopts one stylesheet per style", () => {
    const container = document.createElement("div");

    mountAppRoot(container, { colorScheme: "dark", styles: [".a { color: red; }", ".b { color: blue; }"] });
    expect(container.shadowRoot?.adoptedStyleSheets).toHaveLength(2);
  });

  test("styles every class it sets", () => {
    expectClassesStyled(AppRootClass, TOKENS_CSS);
  });
});
