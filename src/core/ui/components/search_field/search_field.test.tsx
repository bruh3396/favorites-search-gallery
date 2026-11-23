import { SearchField, SearchFieldClass } from "@/core/ui/components/search_field/search_field";
import { describe, expect, test, vi } from "vitest";
import { h, render } from "@/core/ui/h/h";
import SEARCH_FIELD_CSS from "@/core/ui/components/search_field/search_field.css?inline";
import { Signal } from "@/core/utils/reactive/signal";
import { expectClassesStyled } from "@/testing/css_utilities";

function setup(value = new Signal(""), onValueChange = vi.fn()): HTMLInputElement {
  return render(document, () => (
    <SearchField label="Search Shortcuts" value={value} onValueChange={onValueChange} />
  )).result.querySelector("input")!;
}

describe("SearchField", () => {
  test("names its input after its label", () => {
    expect(setup().getAttribute("aria-label")).toBe("Search Shortcuts");
  });

  test("reports each change as it is typed", () => {
    const onValueChange = vi.fn();
    const input = setup(new Signal(""), onValueChange);

    input.value = "zen";
    input.dispatchEvent(new Event("input", { bubbles: true }));
    expect(onValueChange).toHaveBeenCalledWith("zen");
  });

  test("follows its value", () => {
    const value = new Signal("zen");
    const input = setup(value);
    const currentValue = input.value;

    value.value = "";
    expect([currentValue, input.value]).toEqual(["zen", ""]);
  });

  test("styles every class it sets", () => {
    expectClassesStyled(SearchFieldClass, SEARCH_FIELD_CSS);
  });
});
