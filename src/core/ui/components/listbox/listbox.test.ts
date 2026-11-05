import { describe, test } from "vitest";
import LISTBOX_CSS from "@/core/ui/components/listbox/listbox.css?inline";
import { ListboxClass } from "@/core/ui/components/listbox/listbox";
import { expectClassesStyled } from "@/testing/css_utilities";

describe("ListboxClass", () => {
  test("styles every class it lists", () => {
    expectClassesStyled(ListboxClass, LISTBOX_CSS);
  });
});
