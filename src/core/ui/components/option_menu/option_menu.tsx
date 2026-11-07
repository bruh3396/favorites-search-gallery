import { Signal, computed, effect } from "@/core/utils/reactive/signal";
import { ControlSize } from "@/core/ui/components/control/control_size";
import { ListboxClass } from "@/core/ui/components/listbox/listbox";
import { OptionMenuItem } from "@/core/ui/components/option_menu/option_menu_item";
import { createIcon } from "@/core/ui/components/icon/icon";
import { h } from "@/core/ui/h/h";
import { onCleanup } from "@/core/utils/reactive/scope";

export const OptionMenuClass = {
  root: "fsg-OptionMenu",
  option: "fsg-OptionMenu-option",
  label: "fsg-OptionMenu-label",
  check: "fsg-OptionMenu-check"
} as const;

export interface OptionMenuProps {
  trigger: HTMLElement;
  items: readonly OptionMenuItem[];
  controlSize?: ControlSize;
  onActiveChange?: (activeIndex: number | undefined) => void;
}

const POPUP_GAP = 4;
const NO_OPTION = -1;

export function OptionMenu({ trigger, items: optionMenuItems, controlSize = "medium", onActiveChange }: OptionMenuProps): HTMLElement {
  const open = new Signal(false);
  const active = new Signal(NO_OPTION);
  const activate = (index: number): void => {
    active.value = index;
    onActiveChange?.(index === NO_OPTION ? undefined : index);
  };
  const getFirstSelectedIndex = (): number => Math.max(optionMenuItems.findIndex(optionMenuItem => optionMenuItem.selected.peek()), 0);
  const options = optionMenuItems.map(({ label, selected, disabled, startsGroup = false }, index) => (
    <li
      className={`${ListboxClass.option} ${OptionMenuClass.option}`}
      role="option"
      aria-selected={computed(() => String(selected.value))}
      aria-disabled={computed(() => (disabled?.value === true ? "true" : null))}
      dataset={{ active: computed(() => String(active.value === index)), startsGroup: String(startsGroup) }}
      onPointermove={() => {
        if (active.peek() !== index) {
          activate(index);
        }
      }}
      onClick={() => choose(index)}
    >
      <span className={OptionMenuClass.label}>{label}</span>
      {createIcon("check", OptionMenuClass.check)}
    </li>
  ));
  const popup = (
    <ul
      className={`${ListboxClass.root} ${OptionMenuClass.root}`}
      role="listbox"
      dataset={{ size: controlSize }}
      onPointerleave={() => activate(NO_OPTION)}
      onClick={event => event.stopPropagation()}
    >
      {options}
    </ul>
  );
  const closeOnOutsidePress = (event: PointerEvent): void => {
    const path = event.composedPath();

    if (!path.includes(trigger) && !path.includes(popup)) {
      close();
    }
  };

  function show(): void {
    open.value = true;
    trigger.after(popup);
    placePopup(trigger, popup);
    trigger.ownerDocument.addEventListener("pointerdown", closeOnOutsidePress, true);
    activate(getFirstSelectedIndex());
    options[active.peek()].scrollIntoView?.({ block: "nearest" });
  }

  function close(): void {
    if (!open.peek()) {
      return;
    }
    open.value = false;
    popup.remove();
    trigger.ownerDocument.removeEventListener("pointerdown", closeOnOutsidePress, true);
    activate(NO_OPTION);
  }

  function choose(index: number): void {
    const { disabled, keepsOpen = false, onChoose } = optionMenuItems[index];

    if (disabled?.peek() === true) {
      return;
    }
    onChoose();

    if (!keepsOpen) {
      close();
      trigger.focus();
    }
  }

  function handleKey(event: KeyboardEvent): void {
    if (!open.peek()) {
      if (["ArrowDown", "ArrowUp", "Enter", " "].includes(event.key)) {
        event.preventDefault();
        show();
      }
      return;
    }
    const last = optionMenuItems.length - 1;
    const from = active.peek() === NO_OPTION ? getFirstSelectedIndex() : active.peek();
    const moves: Readonly<Record<string, number>> = { ArrowDown: Math.min(from + 1, last), ArrowUp: Math.max(from - 1, 0), Home: 0, End: last };
    const to = moves[event.key];

    if (to !== undefined) {
      event.preventDefault();
      activate(to);
      options[to].scrollIntoView?.({ block: "nearest" });
    } else if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      choose(from);
    } else if (event.key === "Escape") {
      event.preventDefault();
      event.stopPropagation();
      close();
    } else if (event.key === "Tab") {
      close();
    }
  }

  trigger.setAttribute("aria-haspopup", "listbox");
  trigger.addEventListener("click", () => (open.peek() ? close() : show()));
  trigger.addEventListener("keydown", handleKey);
  trigger.ariaControlsElements = [popup];
  effect(() => {
    trigger.setAttribute("aria-expanded", String(open.value));
    trigger.ariaActiveDescendantElement = open.value && active.value !== NO_OPTION ? options[active.value] : null;
  });
  onCleanup(close);
  return trigger;
}

function placePopup(trigger: HTMLElement, popup: HTMLElement): void {
  const anchor = trigger.getBoundingClientRect();
  const viewportHeight = trigger.ownerDocument.documentElement.clientHeight;
  const spaceBelow = viewportHeight - anchor.bottom - (POPUP_GAP * 2);
  const spaceAbove = anchor.top - (POPUP_GAP * 2);
  const isOpeningUp = popup.scrollHeight > spaceBelow && spaceAbove > spaceBelow;

  popup.style.minInlineSize = `${anchor.width}px`;
  popup.style.left = `${anchor.left}px`;
  popup.style.maxBlockSize = `${Math.max(isOpeningUp ? spaceAbove : spaceBelow, 0)}px`;
  popup.style.top = isOpeningUp ? "" : `${anchor.bottom + POPUP_GAP}px`;
  popup.style.bottom = isOpeningUp ? `${viewportHeight - anchor.top + POPUP_GAP}px` : "";
}
