import { AwesompleteSuggestion } from "../../types/common_types";
import { fetchTagFromAPI } from "../api/api";
import { removeExtraWhiteSpace } from "../../utils/primitive/string";

const CUSTOM_TAGS: Set<string> = loadCustomTags();
const PARSER = new DOMParser();

export function loadCustomTags(): Set<string> {
  return new Set(JSON.parse(localStorage.getItem("customTags") || "[]"));
}

export async function setCustomTags(tags: string): Promise<void> {
  for (const tag of removeExtraWhiteSpace(tags).split(" ")) {
    if (tag === "" || CUSTOM_TAGS.has(tag)) {
      continue;
    }
    const isAnOfficialTag = await isOfficialTag(tag);

    if (!isAnOfficialTag) {
      CUSTOM_TAGS.add(tag);
    }
  }
  localStorage.setItem("customTags", JSON.stringify(Array.from(CUSTOM_TAGS)));
}

export function clearCustomTags(): void {
  CUSTOM_TAGS.clear();
  localStorage.removeItem("customTags");
}

async function isOfficialTag(tagName: string): Promise<boolean> {
  try {
    const html = await fetchTagFromAPI(tagName);
    const dom = PARSER.parseFromString(html, "text/html");
    const columnOfFirstRow = dom.getElementsByClassName("highlightable")[0].getElementsByTagName("td");
    return columnOfFirstRow.length === 3;
  } catch (error) {
    console.error(error);
    return false;
  }
}

export function addCustomTagsToAutocomplete(officialTags: AwesompleteSuggestion[], searchQuery: string): AwesompleteSuggestion[] {
  const customTags = Array.from(CUSTOM_TAGS);
  const officialTagValues = new Set(officialTags.map(officialTag => officialTag.value));
  const mergedTags = officialTags;

  for (const customTag of customTags) {
    if (!officialTagValues.has(customTag) && customTag.startsWith(searchQuery)) {
      mergedTags.unshift({
        label: `${customTag} (custom)`,
        value: customTag,
        type: "custom"
      });
    }
  }
  return mergedTags;
}
