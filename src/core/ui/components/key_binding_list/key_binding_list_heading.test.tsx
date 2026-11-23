import { KeyBindingListHeading, KeyBindingListHeadingClass } from "@/core/ui/components/key_binding_list/key_binding_list_heading";
import { describe, expect, test } from "vitest";
import { h, render } from "@/core/ui/h/h";
import KEY_BINDING_LIST_HEADING_CSS from "@/core/ui/components/key_binding_list/key_binding_list_heading.css?inline";
import { expectClassesStyled } from "@/testing/css_utilities";

describe("KeyBindingListHeading", () => {
  test("shows its title as a heading", () => {
    const heading = render(document, () => <KeyBindingListHeading title="Grid" />).result;

    expect([heading.tagName, heading.textContent]).toEqual(["H3", "Grid"]);
  });

  test("styles every class it sets", () => {
    expectClassesStyled(KeyBindingListHeadingClass, KEY_BINDING_LIST_HEADING_CSS);
  });
});
