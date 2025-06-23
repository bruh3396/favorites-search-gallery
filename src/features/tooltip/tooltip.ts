import { ON_FAVORITES_PAGE, ON_SEARCH_PAGE } from "../../lib/global/flags/intrinsic_flags";
import { convertToTagString, extractTagGroups, removeExtraWhiteSpace } from "../../utils/primitive/string";
import { getImageFromThumb, getThumbFromImage } from "../../utils/dom/dom";
import { Events } from "../../lib/global/events/events";
import { FAVORITES_SEARCH_GALLERY_CONTAINER } from "../../lib/global/container";
import { Preferences } from "../../store/local_storage/preferences";
import { TOOLTIP_DISABLED } from "../../lib/global/flags/derived_flags";
import { TOOLTIP_HTML } from "../../assets/html";
import { getTagSetFromThumb } from "../../utils/dom/tags";

let tooltip: HTMLElement;
let defaultTransition: string;
let visible: boolean;
let searchTagColorCodes: Record<string, string>;
let searchBox: HTMLTextAreaElement;
let previousSearch: string;
let currentImage: HTMLImageElement | null;

export function setupTooltip(): void {
  if (TOOLTIP_DISABLED) {
    return;
  }
  visible = Preferences.tooltipsVisible.value;
  FAVORITES_SEARCH_GALLERY_CONTAINER.insertAdjacentHTML("afterbegin", TOOLTIP_HTML);
  tooltip = createTooltip();
  defaultTransition = tooltip.style.transition;
  searchTagColorCodes = {};
  currentImage = null;
  addEventListeners();
  assignColorsToMatchedTags();
}

function createTooltip(): HTMLElement {
  const t = document.createElement("span");
  const container = document.getElementById("tooltip-container");

  t.className = "light-green-gradient";
  t.id = "tooltip";

  if (container !== null) {
    container.appendChild(t);
  }
  return t;
}

function addEventListeners(): void {
  addCommonEventListeners();
  addFavoritesPageEventListeners();
}

function addCommonEventListeners(): void {
  addMouseOverEventListener();
}

function addFavoritesPageEventListeners(): void {
  if (!ON_FAVORITES_PAGE) {
    return;
  }
  Events.favorites.tooltipsToggled.on((value) => {
    toggleVisibility(value);

    if (ON_FAVORITES_PAGE) {
      if (currentImage === null) {
        return;
      }

      if (visible) {
        show(currentImage);
      } else {
        hide();
      }
      return;
    }

    if (ON_SEARCH_PAGE) {
      toggleVisibility();

      if (currentImage !== null) {
        hide();
      }
    }
  });
}

function addMouseOverEventListener(): void {
  Events.document.mouseover.on((mouseOverEvent) => {
    if (mouseOverEvent.thumb === null) {
      hide();
      currentImage = null;
      return;
    }

    // if (Utils.enteredOverCaptionTag(mouseOverEvent.originalEvent)) {
    //   return;
    // }
    const image = getImageFromThumb(mouseOverEvent.thumb);

    if (image === null) {
      return;
    }
    currentImage = image;

    if (visible) {
      show(image);
    }
  });
}

function assignColorsToMatchedTags(): void {
  if (ON_SEARCH_PAGE) {
    assignColorsToMatchedTagsOnSearchPage();
    return;
  }
  const newSearchBox = document.getElementById("favorites-search-box");

  if (!(newSearchBox instanceof HTMLTextAreaElement)) {
    return;
  }
  searchBox = newSearchBox;

  assignColorsToMatchedTagsOnFavoritesPage();
  searchBox.addEventListener("input", () => {
    assignColorsToMatchedTagsOnFavoritesPage();
  });
  Events.favorites.searchResultsUpdated.on(() => {
    assignColorsToMatchedTagsOnFavoritesPage();
  });
}

function setPosition(image: HTMLImageElement): void {
  const fancyHoveringStyle = document.getElementById("fancy-image-hovering-fsg-style");
  const imageChangesSizeOnHover = fancyHoveringStyle !== null && fancyHoveringStyle.textContent !== "";
  let rect;

  if (imageChangesSizeOnHover) {
    const imageContainer = image.parentElement as HTMLElement;
    const sizeCalculationDiv = document.createElement("div");

    sizeCalculationDiv.className = "size-calculation-div";
    imageContainer.appendChild(sizeCalculationDiv);
    rect = sizeCalculationDiv.getBoundingClientRect();
    sizeCalculationDiv.remove();
  } else {
    rect = image.getBoundingClientRect();
  }
  const offset = 7;
  let tooltipRect;

  tooltip.style.top = `${rect.bottom + offset + window.scrollY}px`;
  tooltip.style.left = `${rect.x - 3}px`;
  tooltip.classList.toggle("visible", true);
  tooltipRect = tooltip.getBoundingClientRect();
  const toolTipIsClippedAtBottom = tooltipRect.bottom > window.innerHeight;

  if (!toolTipIsClippedAtBottom) {
    return;
  }
  tooltip.style.top = `${rect.top - tooltipRect.height + window.scrollY - offset}px`;
  tooltipRect = tooltip.getBoundingClientRect();
  const menu = document.getElementById("favorites-search-gallery-menu");
  const elementAboveTooltip = menu === null ? document.getElementById("header") : menu;

  if (elementAboveTooltip === null) {
    return;
  }
  const elementAboveTooltipRect = elementAboveTooltip.getBoundingClientRect();
  const toolTipIsClippedAtTop = tooltipRect.top < elementAboveTooltipRect.bottom;

  if (!toolTipIsClippedAtTop) {
    return;
  }
  const tooltipIsLeftOfCenter = tooltipRect.left < (window.innerWidth / 2);

  tooltip.style.top = `${rect.top + window.scrollY + (rect.height / 2) - offset}px`;

  if (tooltipIsLeftOfCenter) {
    tooltip.style.left = `${rect.right + offset}px`;
  } else {
    tooltip.style.left = `${rect.left - 750 - offset}px`;
  }
}

function show(image: HTMLImageElement): void {
  tooltip.innerHTML = formatHTML(getTags(image));
  setPosition(image);
}

function hide(): void {
  tooltip.style.transition = "none";
  tooltip.classList.toggle("visible", false);
  setTimeout(() => {
    tooltip.style.transition = defaultTransition;
  }, 5);
}

function getTags(image: HTMLImageElement): string {
  const thumb = getThumbFromImage(image);

  if (thumb === null) {
    return "";
  }
  const tags = getTagSetFromThumb(thumb);

  if (searchTagColorCodes[thumb.id] === undefined) {
    tags.delete(thumb.id);
  }
  return convertToTagString(tags);
}

function getRandomColor(): string {
  const letters = "0123456789ABCDEF";
  let color = "#";

  for (let i = 0; i < 6; i += 1) {
    if (i === 2 || i === 3) {
      color += "0";
    } else {
      color += letters[Math.floor(Math.random() * letters.length)];
    }
  }
  return color;
}

function formatHTML(tags: string): string {
  let unmatchedTagsHTML = "";
  let matchedTagsHTML = "";

  const tagList = removeExtraWhiteSpace(tags).split(" ");

  for (let i = 0; i < tagList.length; i += 1) {
    const tag = tagList[i];
    const tagColor = getColorCode(tag);
    const tagWithSpace = `${tag} `;

    if (tagColor === undefined) {
      unmatchedTagsHTML += tagWithSpace;
      // } else if (includesTag(tag, new Set(Utils.tagBlacklist.split(" ")))) {
      // unmatchedTagsHTML += `<span style="color:red"><s><b>${tagWithSpace}</b></s></span>`;
    } else {
      matchedTagsHTML += `<span style="color:${tagColor}"><b>${tagWithSpace}</b></span>`;
    }
    // if (tagColor !== undefined) {
    //   matchedTagsHTML += `<span style="color:${tagColor}"><b>${tagWithSpace}</b></span>`;
    // // } else if (includesTag(tag, new Set(Utils.tagBlacklist.split(" ")))) {
    //   // unmatchedTagsHTML += `<span style="color:red"><s><b>${tagWithSpace}</b></s></span>`;
    // } else {
    //   unmatchedTagsHTML += tagWithSpace;
    // }
  }
  const html = matchedTagsHTML + unmatchedTagsHTML;

  if (html === "") {
    return tags;
  }
  return html;
}

function assignTagColors(searchQuery: string): void {
  searchQuery = removeNotTags(searchQuery);
  const { orGroups, remainingTags } = extractTagGroups(searchQuery);

  searchTagColorCodes = {};
  assignColorsToOrGroupTags(orGroups);
  assignColorsToRemainingTags(remainingTags);
}

function assignColorsToOrGroupTags(orGroups: string[][]): void {

  for (const orGroup of orGroups) {
    const color = getRandomColor();

    for (const tag of orGroup) {
      addColorCodedTag(tag, color);
    }
  }
}

function assignColorsToRemainingTags(remainingTags: string[]): void {
  for (const tag of remainingTags) {
    addColorCodedTag(tag, getRandomColor());
  }
}

function removeNotTags(tags: string): string {
  return tags.replace(/(?:^| )-\S+/gm, "");
}

function sanitizeTags(tags: string): string {
  return tags.toLowerCase().trim();
}

function addColorCodedTag(tag: string, color: string): void {
  tag = sanitizeTags(tag);

  if (searchTagColorCodes[tag] === undefined) {
    searchTagColorCodes[tag] = color;
  }
}

function getColorCode(tag: string): string | undefined {
  if (searchTagColorCodes[tag] !== undefined) {
    return searchTagColorCodes[tag];
  }

  for (const searchTag of Object.keys(searchTagColorCodes)) {
    if (tagsMatchWildcardSearchTag(searchTag, [tag])) {
      return searchTagColorCodes[searchTag];
    }
  }
  return undefined;
}

function tagsMatchWildcardSearchTag(searchTag: string, tags: string[]): boolean {
  try {
    const wildcardRegex = new RegExp(`^${searchTag.replace(/\*/g, ".*")}$`);
    return tags.some(tag => wildcardRegex.test(tag));
  } catch {
    return false;
  }
}

function toggleVisibility(value?: boolean): void {
  if (value === undefined) {
    value = !visible;
  }
  Preferences.tooltipsVisible.set(value);
  visible = value;
}

function assignColorsToMatchedTagsOnSearchPage(): void {
  const searchQuery = document.getElementsByName("tags")[0].getAttribute("value");

  assignTagColors(searchQuery ?? "");
}

function assignColorsToMatchedTagsOnFavoritesPage(): void {
  if (searchBox.value === previousSearch) {
    return;
  }
  previousSearch = searchBox.value;
  assignTagColors(searchBox.value);
}
