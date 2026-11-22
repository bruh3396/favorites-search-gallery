import { KeyBindingList, KeyBindingListClass } from "@/core/ui/components/key_binding_list/key_binding_list";
import { describe, expect, test } from "vitest";
import { h, render } from "@/core/ui/h/h";
import KEY_BINDING_LIST_CSS from "@/core/ui/components/key_binding_list/key_binding_list.css?inline";
import { expectClassesStyled } from "@/testing/css_utilities";

describe("KeyBindingList", () => {
  test("holds its sections", () => {
    const list = render(document, () => (
      <KeyBindingList>
        <section>Search</section>
        <section>Browse</section>
      </KeyBindingList>
    )).result;

    expect([...list.querySelectorAll("section")].map(section => section.textContent)).toEqual(["Search", "Browse"]);
  });

  test("styles every class it sets", () => {
    expectClassesStyled(KeyBindingListClass, KEY_BINDING_LIST_CSS);
  });
});
