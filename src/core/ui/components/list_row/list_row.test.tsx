import { ListRow, ListRowClass } from "@/core/ui/components/list_row/list_row";
import { describe, expect, test, vi } from "vitest";
import { h, render } from "@/core/ui/h/h";
import LIST_ROW_CSS from "@/core/ui/components/list_row/list_row.css?inline";
import { expectClassesStyled } from "@/testing/css_utilities";

describe("ListRow", () => {
  test("shows its children", () => {
    const label = document.createElement("span");
    const { result: listRow } = render(document, () => <ListRow>{label}</ListRow>);

    expect(listRow.contains(label)).toBe(true);
  });

  test("keeps the classes it is given beside its own", () => {
    const { result: listRow } = render(document, () => <ListRow className="fsg-Host-row" />);

    expect(listRow.className).toBe(`${ListRowClass.root} fsg-Host-row`);
  });

  test("reports presses, clicks and focus leaving it", () => {
    const onMousedown = vi.fn();
    const onClick = vi.fn();
    const onFocusout = vi.fn();
    const { result: listRow } = render(document, () => <ListRow onMousedown={onMousedown} onClick={onClick} onFocusout={onFocusout} />);

    listRow.dispatchEvent(new MouseEvent("mousedown", { bubbles: true }));
    listRow.click();
    listRow.dispatchEvent(new FocusEvent("focusout", { bubbles: true }));
    expect([onMousedown.mock.calls.length, onClick.mock.calls.length, onFocusout.mock.calls.length]).toEqual([1, 1, 1]);
  });

  test("styles every class it sets", () => {
    expectClassesStyled(ListRowClass, LIST_ROW_CSS);
  });
});
