import { IconName, icon } from "@/lib/ui/icon";
import { createElement } from "@/utils/browser/element";
import { toggleDisplay } from "@/lib/ui/toggles";

let guide: HTMLElement | null = null;

export function showTutorial(): void {
  toggleDisplay(buildTutorial(), true);
}

export function hideTutorial(): void {
  toggleDisplay(guide, false);
}

function buildTutorial(): HTMLElement {
  if (guide !== null) {
    return guide;
  }
  guide = createElement("div", {
    id: "controls-guide",
    dataset: { hidden: "" },
    children: [
      tapButton("controls-guide-tap-left", "chevronLeft", "Tap · previous"),
      tapButton("controls-guide-tap-right", "chevronRight", "Tap · next"),
      swipe("controls-guide-swipe-up", "chevronUp", "Swipe up · autoplay (if enabled)"),
      swipe("controls-guide-swipe-down", "chevronDown", "Swipe down · exit"),
      hold("controls-guide-hold", "heartFilled", "Tap and hold · add favorite"),
      dismissLabel()
    ]
  });
  guide.addEventListener("click", hideTutorial);
  document.body.appendChild(guide);
  return guide;
}

function tapButton(id: string, iconName: IconName, text: string): HTMLElement {
  return createElement("div", {
    id,
    className: "controls-guide-tap-button",
    children: [icon(iconName), label(text)]
  });
}

function swipe(id: string, iconName: IconName, text: string): HTMLElement {
  return createElement("div", {
    id,
    className: "controls-guide-swipe",
    children: [icon(iconName), label(text)]
  });
}

function hold(id: string, iconName: IconName, text: string): HTMLElement {
  return createElement("div", {
    id,
    className: "controls-guide-hold",
    children: [icon(iconName), label(text)]
  });
}

function dismissLabel(): HTMLElement {
  return createElement("div", {
    id: "controls-guide-dismiss",
    textContent: "Tap anywhere to dismiss"
  });
}

function label(text: string): HTMLElement {
  return createElement("span", { textContent: text });
}
