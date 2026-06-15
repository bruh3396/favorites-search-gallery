import { div } from "@/utils/dom/element_factory";

const OPTIONS: { id: string; label: string }[] = [
  { id: "post-list-upscale-thumbs", label: "Upscale" },
  { id: "post-list-infinite-scroll", label: "Infinite Scroll" },
  { id: "post-list-tooltip", label: "Tooltips" },
  { id: "post-list-autoplay", label: "Autoplay" },
  { id: "post-list-gallery-menu", label: "Gallery Menu" },
  { id: "post-list-favorite-indicator", label: "Favorite Indicator" },
  { id: "post-list-favorite-indicator-style", label: "Favorites" },
  { id: "post-list-gallery-favorite-style", label: "Gallery Favorites" },
  { id: "post-list-performance-profile", label: "Profile" },
  { id: "post-list-layout", label: "Layout" },
  { id: "post-list-column-count", label: "Columns" },
  { id: "post-list-row-size", label: "Row Size" }
];

export function build(): HTMLElement {
  const menu = div("post-list-menu");
  const heading = document.createElement("h6");
  const options = div("post-list-options");

  heading.textContent = "Favorites Search Gallery";
  options.append(...OPTIONS.map(buildOption));
  menu.append(heading, document.createElement("hr"), options, document.createElement("hr"));
  return menu;
}

function buildOption(option: { id: string; label: string }): HTMLElement {
  const slot = div(option.id);
  const slotLabel = document.createElement("label");

  slot.className = "search-menu-option";
  slotLabel.textContent = option.label;
  slot.append(slotLabel);
  return slot;
}
