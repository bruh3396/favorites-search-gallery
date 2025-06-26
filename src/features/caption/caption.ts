import * as API from "../../lib/api/api";
import { capitalize, isOnlyDigits } from "../../utils/primitive/string";
import { debounceAfterFirstCall, sleep } from "../../utils/misc/async";
import { getAllThumbs, getImageFromThumb } from "../../utils/dom/dom";
import { BatchExecutor } from "../../lib/components/batch_executor";
import { CAPTIONS_DISABLED } from "../../lib/global/flags/derived_flags";
import { CAPTION_HTML } from "../../assets/html";
import { ClickCodes } from "../../types/primitives/enums";
import { DO_NOTHING } from "../../config/constants";
import { Database } from "../../lib/components/database";
import { Events } from "../../lib/global/events/events";
import { ON_SEARCH_PAGE } from "../../lib/global/flags/intrinsic_flags";
import { Preferences } from "../../lib/global/preferences/preferences";
import { TagCategory } from "../../types/primitives/primitives";
import { TagCategoryMapping } from "../../types/primitives/composites";
import { createTagAPIURL } from "../../lib/api/api_url";
import { getFavorite } from "../favorites/types/favorite/favorite_item";
import { getTagSetFromThumb } from "../../utils/dom/tags";
import { insertStyleHTML } from "../../utils/dom/style";
import { isTagCategory } from "../../types/primitives/equivalence";
import { openSearchPage } from "../../utils/dom/links";
import { roundToTwoDecimalPlaces } from "../../utils/primitive/number";

const importantTagCategories: Set<TagCategory> = new Set([
  "copyright",
  "character",
  "artist",
  "metadata"
]);
const template = `
    <ul id="caption-list">
        <li id="caption-id" style="display: block;"><h6>ID</h6></li>
        ${getCategoryHeaderHTML()}
    </ul>
  `;
const TAG_CATEGORY_MAPPINGS: Record<string, TagCategory> = {};
const PENDING_REQUESTS: Set<string> = new Set();
const SETTINGS = {
  tagFetchDelayAfterFinishedLoading: 35,
  tagFetchDelayBeforeFinishedLoading: 100,
  maxPendingRequestsAllowed: 100
};
const FLAGS = {
  finishedLoading: false
};
const TAG_CATEGORY_DECODINGS: Record<number, TagCategory> = {
  0: "general",
  1: "artist",
  2: "unknown",
  3: "copyright",
  4: "character",
  5: "metadata"
};
const DATABASE = new Database<TagCategoryMapping>("TagCategories", "tagMappings");
const DATABASE_WRITE_SCHEDULER = new BatchExecutor<TagCategoryMapping>(500, 2000, saveTagCategories);

let captionWrapper: HTMLElement;
let caption: HTMLElement;
let currentThumb: HTMLElement | null = null;
let problematicTags: Set<string>;
let currentThumbId: string | null = null;
let abortController: AbortController;

function getCategoryHeaderHTML(): string {
  let html = "";

  for (const category of importantTagCategories) {
    const capitalizedCategory = capitalize(category);
    const header = capitalizedCategory === "Metadata" ? "Meta" : capitalizedCategory;

    html += `<li id="caption${capitalizedCategory}" style="display: none;"><h6>${header}</h6></li>`;
  }
  return html;
}

function saveTagCategories(mappings: TagCategoryMapping[]): void {
  DATABASE.store(mappings);
}

function isHidden(): boolean {
  return caption.classList.contains("hide") || caption.classList.contains("disabled") || caption.classList.contains("remove");
}

function getTagFetchDelay(): number {
  if (FLAGS.finishedLoading) {
    return SETTINGS.tagFetchDelayAfterFinishedLoading;
  }
  return SETTINGS.tagFetchDelayBeforeFinishedLoading;
}

function initializeFields(): void {
  loadTagCategoryMappings();
  problematicTags = new Set();
  abortController = new AbortController();
}

function createHTMLElement(): void {
  captionWrapper = document.createElement("div");
  captionWrapper.className = "caption-wrapper";
  caption = document.createElement("div");
  caption.className = "caption inactive not-highlightable";
  captionWrapper.appendChild(caption);
  document.head.appendChild(captionWrapper);
  caption.innerHTML = template;
}

function insertHTML(): void {
  insertStyleHTML(CAPTION_HTML, "caption");
}

function toggleVisibility(value?: boolean): void {
  if (value === undefined) {
    value = caption.classList.contains("disabled");
  }

  if (value) {
    caption.classList.remove("disabled");
  } else if (!caption.classList.contains("disabled")) {
    caption.classList.add("disabled");
  }
  Preferences.captionsVisible.set(value);
}

function addEventListeners(): void {
  addCommonEventListeners();
  addFavoritesPageEventListeners();
}

function addCommonEventListeners(): void {
  caption.addEventListener("transitionend", () => {
    if (caption.classList.contains("active")) {
      caption.classList.add("transition-completed");
    }
    caption.classList.remove("transitioning");
  });
  caption.addEventListener("transitionstart", () => {
    caption.classList.add("transitioning");
  });
  Events.favorites.captionsToggled.on((value) => {
    toggleVisibility(value);

    if (currentThumb !== null && !caption.classList.contains("remove")) {
      if (value) {
        attachToThumbHelper(currentThumb);
      } else {
        removeFromThumbHelper(currentThumb);
      }
    }
  });
  Events.document.mouseover.on((mouseOverEvent) => {
    if (mouseOverEvent.insideOfThumb) {
      const insideOfDifferentThumb = currentThumb !== null && mouseOverEvent.thumb !== null && currentThumb.id !== mouseOverEvent.thumb.id;

      if (insideOfDifferentThumb) {
        removeFromThumb(currentThumb);
      }
      attachToThumb(mouseOverEvent.thumb);
      currentThumb = mouseOverEvent.thumb;
    } else {
      if (currentThumb !== null) {
        removeFromThumb(currentThumb);
      }
      currentThumb = null;
    }
  });
}

function addFavoritesPageEventListeners(): void {
  Events.favorites.favoritesLoaded.on(() => {
    FLAGS.finishedLoading = true;
  }, {
    once: true
  });
  Events.favorites.favoritesLoadedFromDatabase.on(() => {
    FLAGS.finishedLoading = true;
  }, {
    once: true
  });
  Events.favorites.pageChanged.on(debounceAfterFirstCall<void>(() => {
    abortAllRequests("Changed Page");
    abortController = new AbortController();
    setTimeout(() => {
      findTagCategoriesOnPageChange();
    }, 600);
  }, 2000));

  Events.favorites.captionsReEnabled.on(() => {
    if (currentThumb !== null) {
      attachToThumb(currentThumb);
    }
  });
  Events.favorites.resetConfirmed.on(() => {
    DATABASE.delete();
  });
}

function attachToThumb(thumb: HTMLElement | null): void {
  if (isHidden() || thumb === null) {
    return;
  }
  attachToThumbHelper(thumb);
}

function attachToThumbHelper(thumb: HTMLElement): void {
  thumb.querySelectorAll(".caption-wrapper-clone").forEach(element => element.remove());
  caption.classList.remove("inactive");
  caption.innerHTML = template;
  captionWrapper.removeAttribute("style");
  const captionIdHeader = caption.querySelector("#caption-id");
  const captionIdTag = document.createElement("li");

  captionIdTag.className = "caption-tag";
  captionIdTag.textContent = thumb.id;
  captionIdTag.onclick = (event): void => {
    event.preventDefault();
    event.stopPropagation();
  };
  captionIdTag.addEventListener("contextmenu", (event) => {
    event.preventDefault();
    event.stopPropagation();
  });

  captionIdTag.onmousedown = (event): void => {
    event.preventDefault();
    event.stopPropagation();
    tagOnClick(thumb.id, event);
    Events.caption.idClicked.emit(thumb.id);
  };
  captionIdHeader?.insertAdjacentElement("afterend", captionIdTag);
  thumb.children[0].appendChild(captionWrapper);
  populateTags(thumb);
}

function removeFromThumb(thumb: HTMLElement | null): void {
  if (isHidden() || thumb === null) {
    return;
  }
  removeFromThumbHelper(thumb);
}

function removeFromThumbHelper(thumb: HTMLElement): void {
  animateRemoval(thumb);
  caption.classList.add("inactive");
  animate(false);
  caption.classList.remove("transition-completed");
}

function animateRemoval(thumb: HTMLElement): void {
  const captionWrapperClone = captionWrapper.cloneNode(true);

  if (!(captionWrapperClone instanceof HTMLElement)) {
    return;
  }
  const captionClone = captionWrapperClone.children[0];

  thumb.querySelectorAll(".caption-wrapper-clone").forEach(element => element.remove());
  captionWrapperClone.classList.add("caption-wrapper-clone");
  captionWrapperClone.querySelectorAll("*").forEach(element => element.removeAttribute("id"));

  if (!(captionClone instanceof HTMLElement)) {
    return;
  }
  captionClone.ontransitionend = (): void => {
    captionWrapperClone.remove();
  };
  thumb.children[0].appendChild(captionWrapperClone);
  setTimeout(() => {
    captionClone.classList.remove("active");
  }, 4);
}

function resizeFont(thumb: HTMLElement): void {
  const columnInput = document.getElementById("column-count");
  const heightCanBeDerivedWithoutRect = thumbMetadataExists(thumb) && columnInput !== null;
  const image = getImageFromThumb(thumb);
  let height = 200;

  if (heightCanBeDerivedWithoutRect && columnInput instanceof HTMLInputElement) {
    height = estimateThumbHeightFromMetadata(thumb, columnInput);
  } else if (image !== null) {

    height = image.getBoundingClientRect().height;
  }
  const fancyImageHoveringStyle = document.getElementById("fancy-image-hovering-fsg-style");
  const fancyHoveringEnabled = fancyImageHoveringStyle !== null && fancyImageHoveringStyle.innerHTML.length > 10;
  const captionListRect = caption.children[0].getBoundingClientRect();
  const ratio = height / captionListRect.height;
  const scale = ratio > 1 ? Math.sqrt(ratio) : ratio * 0.85;
  const finalScale = fancyHoveringEnabled ? scale * 0.8 : scale;

  if (caption !== null && caption.parentElement !== null) {
    caption.parentElement.style.fontSize = `${roundToTwoDecimalPlaces(finalScale)}em`;
  }
}

function thumbMetadataExists(thumb: HTMLElement): boolean {
  if (ON_SEARCH_PAGE) {
    return false;
  }
  const favorite = getFavorite(thumb.id);

  if (favorite === undefined) {
    return false;
  }

  if (favorite.metrics.width <= 0 || favorite.metrics.width <= 0) {
    return false;
  }
  return true;
}

function estimateThumbHeightFromMetadata(thumb: HTMLElement, columnInput: HTMLInputElement): number {
  const favorite = getFavorite(thumb.id);

  if (favorite === undefined) {
    return 200;
  }
  const gridGap = 16;
  const columnCount = Math.max(1, parseInt(columnInput.value));
  const thumbWidthEstimate = (window.innerWidth - (columnCount * gridGap)) / columnCount;
  const thumbWidthScale = favorite.metrics.width / thumbWidthEstimate;
  return favorite.metrics.height / thumbWidthScale;
}

function addTag(tagCategory: TagCategory, tagName: string): void {
  if (!importantTagCategories.has(tagCategory)) {
    return;
  }
  const header = document.getElementById(getCategoryHeaderId(tagCategory));
  const tag = document.createElement("li");

  if (header === null) {
    return;
  }

  tag.className = `${tagCategory}-tag caption-tag`;
  tag.textContent = replaceUnderscoresWithSpaces(tagName);
  header.insertAdjacentElement("afterend", tag);
  header.style.display = "block";
  tag.onmouseover = (event): void => {
    event.stopPropagation();
  };
  tag.onclick = (event): void => {
    event.stopPropagation();
    event.preventDefault();
  };
  tag.addEventListener("contextmenu", (event) => {
    event.preventDefault();
    event.stopPropagation();
  });
  tag.onmousedown = (event): void => {
    event.preventDefault();
    event.stopPropagation();
    tagOnClick(tagName, event);
  };
}

async function loadTagCategoryMappings(): Promise<void> {
  const mappings = await DATABASE.load();

  for (const mapping of mappings) {
    TAG_CATEGORY_MAPPINGS[mapping.id] = mapping.category;
  }
}

function tagOnClick(tagName: string, event: MouseEvent): void {
  switch (event.button) {
    case ClickCodes.LEFT:
      if (event.shiftKey && isOnlyDigits(tagName)) {
        Events.favorites.findFavoriteInAllStarted.emit(tagName);
      } else {
        tagOnClickHelper(tagName, event);
      }
      break;

    case ClickCodes.MIDDLE:
      Events.caption.searchForTag.emit(tagName);
      break;

    case ClickCodes.RIGHT:
      tagOnClickHelper(`-${tagName}`, event);
      break;

    default:
      break;
  }
}

function tagOnClickHelper(value: string, mouseEvent: MouseEvent): void {
  if (ON_SEARCH_PAGE) {
    return;
  }

  if (mouseEvent.ctrlKey) {
    openSearchPage(value);
    return;
  }
  Events.searchBox.appendSearchBox.emit(value);
}

function replaceUnderscoresWithSpaces(tagName: string): string {
  return tagName.replaceAll(/_/gm, " ");
}

function replaceSpacesWithUnderscores(tagName: string): string {
  return tagName.replaceAll(/\s/gm, "_");
}

function animate(value: boolean): void {
  caption.classList.toggle("active", value);
}

function getCategoryHeaderId(tagCategory: TagCategory): string {
  return `caption${capitalize(tagCategory)}`;
}

function populateTags(thumb: HTMLElement): void {
  const tagNames = getTagSetFromThumb(thumb);

  tagNames.delete(thumb.id);
  const unknownThumbTags = Array.from(tagNames)
    .filter(tagName => tagCategoryIsUnknown(thumb, tagName));

  currentThumbId = thumb.id;

  if (allTagsAreProblematic(unknownThumbTags)) {
    correctAllProblematicTagsFromThumb(thumb, () => {
      addTags(tagNames, thumb);
    });
    return;
  }

  if (unknownThumbTags.length > 0) {
    findTagCategories(unknownThumbTags, () => {
      addTags(tagNames, thumb);
    }, 3);
    return;
  }
  addTags(tagNames, thumb);
}

function addTags(tags: Set<string>, thumb: HTMLElement): void {
  if (currentThumbId !== thumb.id) {
    return;
  }

  if (thumb.getElementsByClassName("caption-tag").length > 1) {
    return;
  }

  for (const tagName of Array.from(tags).reverse()) {
    const category = getTagCategory(tagName);

    addTag(category, tagName);
  }
  resizeFont(thumb);
  setTimeout(() => {
    animate(true);
  }, 0);
}

function getTagCategory(tagName: string): TagCategory {
  return TAG_CATEGORY_MAPPINGS[tagName] ?? "general";
}

function allTagsAreProblematic(tags: string[]): boolean {
  for (const tag of tags) {
    if (!problematicTags.has(tag)) {
      return false;
    }
  }
  return tags.length > 0;
}

function correctAllProblematicTagsFromThumb(thumb: HTMLElement, onProblematicTagsCorrected: () => void): void {
  API.fetchPostPage(thumb.id)
    .then((html: string) => {
      const tagCategoryMap = getTagCategoryMapFromPostPage(html);

      for (const [tagName, tagCategory] of tagCategoryMap.entries()) {
        addTagCategoryMapping(tagName, isTagCategory(tagCategory) ? tagCategory : "general");
        problematicTags.delete(tagName);
      }
      onProblematicTagsCorrected();
    })
    .catch((error: unknown) => {
      console.error(error);
    });
}

function getTagCategoryMapFromPostPage(html: string): Map<string, string> {
  const dom = new DOMParser().parseFromString(html, "text/html");
  return Array.from(dom.querySelectorAll(".tag"))
    .reduce((map, element) => {
      const tagCategory = element.classList[0].replace("tag-type-", "");
      const tagName = replaceSpacesWithUnderscores(element.children[1].textContent || "");

      map.set(tagName, tagCategory);
      return map;
    }, new Map());
}

function setAsProblematic(tag: string): void {
  // if (tagCategoryMappings[tag] === undefined && !Utils.customTags.has(tag)) {
  if (TAG_CATEGORY_MAPPINGS[tag] === undefined) {
    problematicTags.add(tag);
  }
}

function findTagCategoriesOnPageChange(): void {
  if (!FLAGS.finishedLoading) {
    return;
  }
  const tagNames = getTagNamesWithUnknownCategories(getAllThumbs().slice(0, 200));

  findTagCategories(tagNames, DO_NOTHING, getTagFetchDelay());
}

function abortAllRequests(reason: string): void {
  abortController.abort(reason);
  abortController = new AbortController();
  PENDING_REQUESTS.clear();
}

async function findTagCategories(tagNames: string[], onAllCategoriesFound: () => void, fetchDelay: number): Promise<void> {
  const parser = new DOMParser();
  const lastTagName = tagNames[tagNames.length - 1];
  const uniqueTagNames = new Set(tagNames);

  for (const tagName of uniqueTagNames) {
    if (isOnlyDigits(tagName) && tagName.length > 5) {
      addTagCategoryMapping(tagName, "general");
      continue;
    }

    if (PENDING_REQUESTS.size > SETTINGS.maxPendingRequestsAllowed) {
      abortAllRequests(`Too many pending requests: ${PENDING_REQUESTS.size}`);
      return;
    }

    if (tagName.includes("'")) {
      setAsProblematic(tagName);
    }

    if (problematicTags.has(tagName)) {
      if (tagName === lastTagName) {
        onAllCategoriesFound();
      }
      continue;
    }

    try {
      PENDING_REQUESTS.add(tagName);
      fetch(createTagAPIURL(tagName), {
        signal: abortController.signal
      })
        .then((response) => {
          if (response.ok) {
            return response.text();
          }
          throw new Error(response.statusText);
        })
        .then((html) => {
          PENDING_REQUESTS.delete(tagName);
          const dom = parser.parseFromString(html, "text/html");
          const encoding = dom.getElementsByTagName("tag")[0].getAttribute("type");

          if (encoding === "array") {
            setAsProblematic(tagName);
            return;
          }
          addTagCategoryMapping(tagName, decodeTagCategory(parseInt(encoding ?? "0")));

          if (tagName === lastTagName) {
            onAllCategoriesFound();
          }
        }).catch(() => {
          onAllCategoriesFound();
        });
    } catch (error) {
      PENDING_REQUESTS.delete(tagName);
      console.error(error);
    }
    await sleep(fetchDelay ?? getTagFetchDelay());
  }
}

function getTagNamesWithUnknownCategories(thumbs: HTMLElement[]): string[] {
  const tagNamesWithUnknownCategories: Set<string> = new Set();

  for (const thumb of thumbs) {
    const tagNames = Array.from(getTagSetFromThumb(thumb));

    for (const tagName of tagNames) {
      if (tagCategoryIsUnknown(thumb, tagName)) {
        tagNamesWithUnknownCategories.add(tagName);
      }
    }
  }
  return Array.from(tagNamesWithUnknownCategories);
}

function tagCategoryIsUnknown(thumb: HTMLElement, tagName: string): boolean {
  // return tagName !== thumb.id && tagCategoryMappings[tagName] === undefined && !Utils.customTags.has(tagName);
  return tagName !== thumb.id && TAG_CATEGORY_MAPPINGS[tagName] === undefined;
}

// function convertToTagCategory(tagCategory: string): TagCategory {
//   return isTagCategory(tagCategory) ? tagCategory : "general";
// }

function decodeTagCategory(encoding: number): TagCategory {
  return TAG_CATEGORY_DECODINGS[encoding] ?? "general";
}

function addTagCategoryMapping(id: string, category: TagCategory): void {
  if (TAG_CATEGORY_MAPPINGS[id] !== undefined) {
    return;
  }
  TAG_CATEGORY_MAPPINGS[id] = category;
  DATABASE_WRITE_SCHEDULER.add({
    id,
    category
  });
}

export function setupCaptions(): void {
  if (CAPTIONS_DISABLED) {
    return;
  }
  initializeFields();
  createHTMLElement();
  insertHTML();
  toggleVisibility(Preferences.captionsVisible.value);
  addEventListeners();
}
