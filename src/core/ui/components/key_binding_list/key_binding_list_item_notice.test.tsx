import { KeyBindingListItemNotice, KeyBindingListItemNoticeClass } from "@/core/ui/components/key_binding_list/key_binding_list_item_notice";
import { describe, expect, test, vi } from "vitest";
import { h, render } from "@/core/ui/h/h";
import KEY_BINDING_LIST_ITEM_NOTICE_CSS from "@/core/ui/components/key_binding_list/key_binding_list_item_notice.css?inline";
import { expectClassesStyled } from "@/testing/css_utilities";

describe("KeyBindingListItemNotice", () => {
  test("shows its message and each action, running the clicked one", () => {
    const onClick = vi.fn();
    const notice = render(document, () => (
      <KeyBindingListItemNotice message="Z is used by Toggle Zen" actions={[{ label: "Overwrite", onClick }, { label: "Cancel", onClick: vi.fn() }]} />
    )).result;

    [...notice.querySelectorAll("button")].find(button => button.textContent === "Overwrite")!.click();
    expect([notice.textContent, onClick.mock.calls.length]).toEqual(["Z is used by Toggle ZenOverwriteCancel", 1]);
  });

  test("styles every class it sets", () => {
    expectClassesStyled(KeyBindingListItemNoticeClass, KEY_BINDING_LIST_ITEM_NOTICE_CSS);
  });
});
