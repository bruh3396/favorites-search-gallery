import { ContextMenuItem } from "@/core/ui/components/context_menu/context_menu_item";
import { ListboxClass } from "@/core/ui/components/listbox/listbox";
import { h } from "@/core/ui/h/h";
import { onCleanup } from "@/core/utils/reactive/scope";

export const ContextMenuClass = {
  root: "fsg-ContextMenu",
  item: "fsg-ContextMenu-item"
} as const;

export interface ContextMenuProps {
  target: HTMLElement;
  listItems: (event: MouseEvent) => readonly ContextMenuItem[];
}

const NO_ITEM = -1;

export function ContextMenu({ target, listItems }: ContextMenuProps): HTMLElement {
  let contextMenuItems: readonly ContextMenuItem[] = [];
  let itemElements: HTMLElement[] = [];
  let activeIndex = NO_ITEM;
  let focusedElement: HTMLElement | null = null;
  const popup: HTMLElement = (
    <ul
      className={`${ListboxClass.root} ${ContextMenuClass.root}`}
      role="menu"
      tabIndex={-1}
      onKeydown={handleKey}
      onContextmenu={event => {
        event.preventDefault();
        event.stopPropagation();
      }}
      onPointerleave={() => activate(NO_ITEM)}
    />
  );
  const closeOnOutsidePress = (event: PointerEvent): void => {
    if (!event.composedPath().includes(popup)) {
      close();
    }
  };

  function activate(index: number): void {
    activeIndex = index;
    itemElements.forEach((itemElement, itemIndex) => (itemElement.dataset.active = String(itemIndex === index)));
    popup.ariaActiveDescendantElement = itemElements[index] ?? null;
  }

  function show(event: MouseEvent): void {
    close();
    contextMenuItems = listItems(event);

    if (contextMenuItems.length === 0) {
      return;
    }
    event.preventDefault();
    focusedElement = (target.getRootNode() as Document | ShadowRoot).activeElement as HTMLElement | null;
    itemElements = contextMenuItems.map(({ label, disabled = false, startsGroup = false }, index) => {
      const itemElement = target.ownerDocument.createElement("li");

      itemElement.className = `${ListboxClass.option} ${ContextMenuClass.item}`;
      itemElement.setAttribute("role", "menuitem");
      itemElement.textContent = label;
      itemElement.dataset.startsGroup = String(startsGroup);

      if (disabled) {
        itemElement.setAttribute("aria-disabled", "true");
      }
      itemElement.addEventListener("pointermove", () => {
        if (activeIndex !== index) {
          activate(index);
        }
      });
      itemElement.addEventListener("click", () => choose(index));
      return itemElement;
    });
    popup.replaceChildren(...itemElements);
    target.append(popup);
    placePopup(popup, event);
    target.ownerDocument.addEventListener("pointerdown", closeOnOutsidePress, true);
    activate(NO_ITEM);
    popup.focus();
  }

  function close(): void {
    if (!popup.isConnected) {
      return;
    }
    popup.remove();
    target.ownerDocument.removeEventListener("pointerdown", closeOnOutsidePress, true);
    activate(NO_ITEM);
    focusedElement?.focus();
    focusedElement = null;
  }

  function choose(index: number): void {
    if (contextMenuItems[index].disabled === true) {
      return;
    }
    close();
    contextMenuItems[index].onChoose();
  }

  function step(from: number, offset: number): number {
    for (let count = 1; count <= contextMenuItems.length; count += 1) {
      const index = (from + (offset * count) + contextMenuItems.length) % contextMenuItems.length;

      if (contextMenuItems[index].disabled !== true) {
        return index;
      }
    }
    return NO_ITEM;
  }

  function handleKey(event: KeyboardEvent): void {
    const moves: Readonly<Record<string, () => number>> = {
      ArrowDown: () => step(activeIndex === NO_ITEM ? -1 : activeIndex, 1),
      ArrowUp: () => step(activeIndex === NO_ITEM ? contextMenuItems.length : activeIndex, -1),
      Home: () => step(-1, 1),
      End: () => step(contextMenuItems.length, -1)
    };
    const move = moves[event.key];

    if (move !== undefined) {
      event.preventDefault();
      activate(move());
    } else if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();

      if (activeIndex !== NO_ITEM) {
        choose(activeIndex);
      }
    } else if (event.key === "Escape") {
      event.preventDefault();
      event.stopPropagation();
      close();
    } else if (event.key === "Tab") {
      event.preventDefault();
      close();
    }
  }

  target.addEventListener("contextmenu", show);
  onCleanup(close);
  return target;
}

function placePopup(popup: HTMLElement, event: MouseEvent): void {
  const zoom = popup.currentCSSZoom ?? 1;
  const { clientWidth, clientHeight } = popup.ownerDocument.documentElement;
  const [viewportWidth, viewportHeight] = [clientWidth / zoom, clientHeight / zoom];
  const [x, y] = [event.clientX / zoom, event.clientY / zoom];
  const { offsetWidth, offsetHeight } = popup;

  popup.style.left = `${Math.max(x + offsetWidth > viewportWidth ? x - offsetWidth : x, 0)}px`;
  popup.style.top = `${Math.max(y + offsetHeight > viewportHeight ? y - offsetHeight : y, 0)}px`;
}
