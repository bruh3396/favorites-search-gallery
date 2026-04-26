import { AwesompleteSuggestion } from "../../../../types/common_types";
import { Storage } from "../../../../lib/core/storage";
import { fetchTagFromAPI } from "../../../../lib/server/fetch/api";
import { removeExtraWhiteSpace } from "../../../../utils/string/format";

const CUSTOM_TAGS: Set<string> = loadCustomTags();
const PARSER = new DOMParser();

export function loadCustomTags(): Set<string> {
  return new Set(Storage.get<string[]>("customTags") ?? []);
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
  Storage.set("customTags", [...CUSTOM_TAGS]);
}

export function clearCustomTags(): void {
  CUSTOM_TAGS.clear();
  Storage.remove("customTags");
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
