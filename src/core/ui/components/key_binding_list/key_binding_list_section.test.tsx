import { KeyBindingListSection, KeyBindingListSectionClass } from "@/core/ui/components/key_binding_list/key_binding_list_section";
import { describe, expect, test } from "vitest";
import { h, render } from "@/core/ui/h/h";
import KEY_BINDING_LIST_SECTION_CSS from "@/core/ui/components/key_binding_list/key_binding_list_section.css?inline";
import { expectClassesStyled } from "@/testing/css_utilities";

describe("KeyBindingListSection", () => {
  test("holds its items", () => {
    const section = render(document, () => (
      <KeyBindingListSection>
        <span>Next Page</span>
      </KeyBindingListSection>
    )).result;

    expect(section.textContent).toBe("Next Page");
  });

  test("styles every class it sets", () => {
    expectClassesStyled(KeyBindingListSectionClass, KEY_BINDING_LIST_SECTION_CSS);
  });
});
