import { IconName, icon } from "@/lib/ui/icon";
import { createElement } from "@/utils/browser/element";

export function mount(container: HTMLElement): void {
  container.append(
    tapButton("gallery-tutorial-tap-left", "chevronLeft", "Tap · previous"),
    tapButton("gallery-tutorial-tap-right", "chevronRight", "Tap · next"),
    swipe("gallery-tutorial-swipe-up", "chevronUp", "Swipe up · autoplay (if enabled)"),
    swipe("gallery-tutorial-swipe-down", "chevronDown", "Swipe down · exit"),
    hold("gallery-tutorial-hold", "heartFilled", "Tap and hold · add favorite"),
    dismissLabel()
  );
}

function tapButton(id: string, iconName: IconName, text: string): HTMLElement {
  return createElement("div", {
    id,
    className: "gallery-tutorial-tap-button",
    children: [icon(iconName), label(text)]
  });
}

function swipe(id: string, iconName: IconName, text: string): HTMLElement {
  return createElement("div", {
    id,
    className: "gallery-tutorial-swipe",
    children: [icon(iconName), label(text)]
  });
}

function hold(id: string, iconName: IconName, text: string): HTMLElement {
  return createElement("div", {
    id,
    className: "gallery-tutorial-hold",
    children: [icon(iconName), label(text)]
  });
}

function dismissLabel(): HTMLElement {
  return createElement("div", {
    id: "gallery-tutorial-dismiss",
    textContent: "Tap anywhere to dismiss"
  });
}

function label(text: string): HTMLElement {
  return createElement("span", { textContent: text });
}
