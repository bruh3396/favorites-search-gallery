import { KeyBindingListItemClass } from "@/core/ui/components/key_binding_list/key_binding_list_item";

export function readKeyBindingListItemText(keyBindingListItem: Element): string {
  return [KeyBindingListItemClass.label, KeyBindingListItemClass.keys, KeyBindingListItemClass.notice]
    .map(partClass => keyBindingListItem.querySelector(`.${partClass}`)!.textContent)
    .join("");
}
