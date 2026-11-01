import { Signal, computed, effect } from "@/core/utils/reactive/signal";
import { ControlChoice } from "@/core/ui/components/control/control_choice";
import { ControlProps } from "@/core/ui/components/control/control_props";
import { createIcon } from "@/core/ui/components/icon/icon";
import { h } from "@/core/ui/h/h";
import { onCleanup } from "@/core/utils/reactive/scope";

export const DropdownClass = {
  root: "fsg-Dropdown",
  label: "fsg-Dropdown-label",
  chevron: "fsg-Dropdown-chevron",
  menu: "fsg-Dropdown-menu",
  option: "fsg-Dropdown-option",
  check: "fsg-Dropdown-check"
} as const;

export interface DropdownProps<Value> extends ControlProps<Value> {
  controlChoices: readonly ControlChoice<Value>[];
  onPreview?: (previewedValue: Value | null) => void;
}

const MENU_GAP = 4;
const NO_OPTION = -1;

export function Dropdown<Value>({
  controlChoices, value, disabled = new Signal(false), onValueChange, onPreview, size: controlSize = "medium"
}: DropdownProps<Value>): HTMLElement {
  const selectedIndex = computed(() => controlChoices.findIndex(controlChoice => controlChoice.value === value.value));
  const open = new Signal(false);
  const active = new Signal(NO_OPTION);
  const activate = (index: number): void => {
    active.value = index;
    onPreview?.(index === NO_OPTION ? null : controlChoices[index].value);
  };
  const options = controlChoices.map(({ label }, index) => (
    <li
      className={DropdownClass.option}
      role="option"
      aria-selected={computed(() => String(selectedIndex.value === index))}
      dataset={{ active: computed(() => String(active.value === index)) }}
      onPointermove={() => {
        if (active.peek() !== index) {
          activate(index);
        }
      }}
      onClick={() => choose(index)}
    >
      <span className={DropdownClass.label}>{label}</span>
      {createIcon("check", DropdownClass.check)}
    </li>
  ));
  const menu = (
    <ul
      className={DropdownClass.menu}
      role="listbox"
      dataset={{ size: controlSize }}
      onPointerleave={() => activate(NO_OPTION)}
      onClick={event => event.stopPropagation()}
    >
      {options}
    </ul>
  );
  const trigger = (
    <button
      className={DropdownClass.root}
      type="button"
      role="combobox"
      aria-haspopup="listbox"
      aria-expanded={computed(() => String(open.value))}
      dataset={{ size: controlSize }}
      disabled={disabled}
      onClick={() => (open.peek() ? close() : show())}
      onKeydown={handleKey}
    >
      <span className={DropdownClass.label}>{computed(() => controlChoices[selectedIndex.value]?.label ?? "")}</span>
      {createIcon("chevronDown", DropdownClass.chevron)}
    </button>
  ) as HTMLButtonElement;
  const closeOnOutsidePress = (event: PointerEvent): void => {
    const path = event.composedPath();

    if (!path.includes(trigger) && !path.includes(menu)) {
      close();
    }
  };

  function show(): void {
    open.value = true;
    trigger.after(menu);
    placeMenu(trigger, menu);
    activate(Math.max(selectedIndex.peek(), 0));
    options[active.peek()].scrollIntoView?.({ block: "nearest" });
    trigger.ownerDocument.addEventListener("pointerdown", closeOnOutsidePress, true);
  }

  function close(): void {
    if (!open.peek()) {
      return;
    }
    open.value = false;
    menu.remove();
    activate(NO_OPTION);
    trigger.ownerDocument.removeEventListener("pointerdown", closeOnOutsidePress, true);
  }

  function choose(index: number): void {
    if (index !== selectedIndex.peek()) {
      onValueChange(controlChoices[index].value);
    }
    close();
    trigger.focus();
  }

  function handleKey(event: KeyboardEvent): void {
    if (!open.peek()) {
      if (["ArrowDown", "ArrowUp", "Enter", " "].includes(event.key)) {
        event.preventDefault();
        show();
      }
      return;
    }
    const last = controlChoices.length - 1;
    const from = active.peek() === NO_OPTION ? Math.max(selectedIndex.peek(), 0) : active.peek();
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

  trigger.ariaControlsElements = [menu];
  effect(() => {
    trigger.ariaActiveDescendantElement = open.value && active.value !== NO_OPTION ? options[active.value] : null;
  });
  onCleanup(close);
  return trigger;
}

function placeMenu(trigger: HTMLElement, menu: HTMLElement): void {
  const anchor = trigger.getBoundingClientRect();
  const viewportHeight = trigger.ownerDocument.documentElement.clientHeight;
  const spaceBelow = viewportHeight - anchor.bottom - (MENU_GAP * 2);
  const spaceAbove = anchor.top - (MENU_GAP * 2);
  const isOpeningUp = menu.scrollHeight > spaceBelow && spaceAbove > spaceBelow;

  menu.style.minInlineSize = `${anchor.width}px`;
  menu.style.left = `${anchor.left}px`;
  menu.style.maxBlockSize = `${Math.max(isOpeningUp ? spaceAbove : spaceBelow, 0)}px`;
  menu.style.top = isOpeningUp ? "" : `${anchor.bottom + MENU_GAP}px`;
  menu.style.bottom = isOpeningUp ? `${viewportHeight - anchor.top + MENU_GAP}px` : "";
}
