import { h, render } from "@/core/ui/h/h";
import { ContextMenuItem } from "@/core/ui/components/context_menu/context_menu_item";
import { ListboxClass } from "@/core/ui/components/listbox/listbox";
import { createIcon } from "@/core/ui/components/icon/icon";
import { onCleanup } from "@/core/utils/reactive/scope";

export const ContextMenuClass = {
  root: "fsg-ContextMenu",
  scrim: "fsg-ContextMenu-scrim",
  item: "fsg-ContextMenu-item",
  icon: "fsg-ContextMenu-icon",
  shortcut: "fsg-ContextMenu-shortcut"
} as const;

export interface ContextMenuProps {
  target: HTMLElement;
  opensOn?: "contextmenu" | "click";
  listItems: (event: MouseEvent) => readonly ContextMenuItem[];
  onOpenChange?: (isOpen: boolean) => void;
}

const NO_ITEM = -1;
const ANCHOR_GAP = 4;
const CONTAINED_EVENT_TYPES = ["pointerdown", "mousedown", "wheel"] as const;
const DISMISSING_EVENT_TYPES = ["click", "auxclick", "contextmenu"] as const;

export function ContextMenu({ target, opensOn = "contextmenu", listItems, onOpenChange }: ContextMenuProps): HTMLElement {
  const isClickTriggered = opensOn === "click";
  const ownerWindow = target.ownerDocument.defaultView;
  let contextMenuItems: readonly ContextMenuItem[] = [];
  let itemElements: HTMLElement[] = [];
  let disposeItemElements = (): void => undefined;
  let placePopup = (): void => undefined;
  let activeIndex = NO_ITEM;
  let focusedElement: HTMLElement | null = null;
  const scrim: HTMLElement = <div className={ContextMenuClass.scrim} />;
  const popup: HTMLElement = (
    <ul
      className={`${ListboxClass.root} ${ContextMenuClass.root}`}
      role="menu"
      tabIndex={-1}
      onKeydown={handleKey}
      onContextmenu={blockEvent}
      onPointerleave={() => activate(NO_ITEM)}
    />
  );

  for (const type of CONTAINED_EVENT_TYPES) {
    scrim.addEventListener(type, blockEvent, { passive: false });
    popup.addEventListener(type, event => event.stopPropagation());
  }

  for (const type of DISMISSING_EVENT_TYPES) {
    scrim.addEventListener(type, dismiss);
  }

  function blockEvent(event: Event): void {
    event.preventDefault();
    event.stopPropagation();
  }

  function dismiss(event: Event): void {
    blockEvent(event);
    close();
  }

  function activate(index: number): void {
    activeIndex = index;
    itemElements.forEach((itemElement, itemIndex) => (itemElement.dataset.active = String(itemIndex === index)));
    popup.ariaActiveDescendantElement = itemElements[index] ?? null;
  }

  function createItemElement({ label, icon, shortcut, checked, disabled = false, startsGroup = false }: ContextMenuItem, index: number): HTMLElement {
    const itemElement = target.ownerDocument.createElement("li");

    itemElement.className = `${ListboxClass.option} ${ContextMenuClass.item}`;
    itemElement.setAttribute("role", checked === undefined ? "menuitem" : "menuitemcheckbox");
    itemElement.dataset.startsGroup = String(startsGroup);

    if (checked !== undefined) {
      itemElement.setAttribute("aria-checked", String(checked));
    }

    if (disabled) {
      itemElement.setAttribute("aria-disabled", "true");
    }

    if (icon !== undefined) {
      itemElement.append(createIcon(icon, ContextMenuClass.icon));
    }
    itemElement.append(label);

    if (shortcut !== undefined) {
      itemElement.append(<span className={ContextMenuClass.shortcut} aria-hidden="true">{shortcut}</span>);
    }
    itemElement.addEventListener("pointermove", () => {
      if (activeIndex !== index) {
        activate(index);
      }
    });
    itemElement.addEventListener("click", () => choose(index));
    return itemElement;
  }

  function show(event: MouseEvent): void {
    close();
    contextMenuItems = listItems(event);

    if (contextMenuItems.length === 0) {
      return;
    }
    event.preventDefault();
    focusedElement = isClickTriggered ? target : (target.getRootNode() as Document | ShadowRoot).activeElement as HTMLElement | null;
    ({ result: itemElements, dispose: disposeItemElements } = render(target.ownerDocument, () => contextMenuItems.map(createItemElement)));
    popup.replaceChildren(...itemElements);

    if (isClickTriggered) {
      target.after(scrim, popup);
      target.setAttribute("aria-expanded", "true");
      placePopup = (): void => placeUnderAnchor(popup, target);
    } else {
      target.append(scrim, popup);
      placePopup = (): void => placeAtPointer(popup, event);
    }
    placePopup();
    ownerWindow?.addEventListener("resize", placePopup);
    ownerWindow?.addEventListener("blur", close);
    activate(isClickTriggered && event.detail === 0 ? step(NO_ITEM, 1) : NO_ITEM);
    popup.focus();
    onOpenChange?.(true);
  }

  function close(): void {
    if (!popup.isConnected) {
      return;
    }
    scrim.remove();
    popup.remove();
    disposeItemElements();

    if (isClickTriggered) {
      target.setAttribute("aria-expanded", "false");
    }
    ownerWindow?.removeEventListener("resize", placePopup);
    ownerWindow?.removeEventListener("blur", close);
    activate(NO_ITEM);
    focusedElement?.focus();
    focusedElement = null;
    onOpenChange?.(false);
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
    event.stopPropagation();
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
      close();
    } else if (event.key === "Tab") {
      event.preventDefault();
      close();
    }
  }

  if (isClickTriggered) {
    target.setAttribute("aria-haspopup", "menu");
    target.setAttribute("aria-expanded", "false");
    target.addEventListener("click", event => (popup.isConnected ? close() : show(event)));
  } else {
    target.addEventListener("contextmenu", show);
  }
  onCleanup(close);
  return target;
}

function readViewport(popup: HTMLElement): { zoom: number; width: number; height: number } {
  const zoom = popup.currentCSSZoom ?? 1;
  const { clientWidth, clientHeight } = popup.ownerDocument.documentElement;
  return { zoom, width: clientWidth / zoom, height: clientHeight / zoom };
}

function placeAtPointer(popup: HTMLElement, event: MouseEvent): void {
  const { zoom, width, height } = readViewport(popup);
  const [x, y] = [event.clientX / zoom, event.clientY / zoom];
  const { offsetWidth, offsetHeight } = popup;

  popup.style.left = `${Math.max(x + offsetWidth > width ? x - offsetWidth : x, 0)}px`;
  popup.style.top = `${Math.max(y + offsetHeight > height ? y - offsetHeight : y, 0)}px`;
}

function placeUnderAnchor(popup: HTMLElement, anchor: HTMLElement): void {
  const { zoom, width, height } = readViewport(popup);
  const anchorRect = anchor.getBoundingClientRect();
  const [left, top, right, bottom] = [anchorRect.left / zoom, anchorRect.top / zoom, anchorRect.right / zoom, anchorRect.bottom / zoom];
  const { offsetWidth, offsetHeight } = popup;
  const below = bottom + ANCHOR_GAP;
  const above = top - ANCHOR_GAP - offsetHeight;
  const endAligned = right - offsetWidth;

  popup.style.left = `${Math.max(Math.min(endAligned >= 0 ? endAligned : left, width - offsetWidth), 0)}px`;
  popup.style.top = `${Math.max(below + offsetHeight > height && above >= 0 ? above : below, 0)}px`;
}
