import { AwesompleteSuggestion } from "../../types/ui";
import { Storage } from "../core/storage/storage_instance";
import { domParser } from "../dom/dom_parser";
import { fetchTagFromAPI } from "../server/fetch/tag_fetcher";
import { removeExtraWhiteSpace } from "../../utils/string/format";

const STORAGE_KEY = "customTags";
const allCustomTags: Set<string> = new Set(Storage.get<string[]>(STORAGE_KEY) ?? []);

export async function setCustomTags(tags: string): Promise<void> {
  for (const tag of removeExtraWhiteSpace(tags).split(" ")) {
    if (tag === "" || allCustomTags.has(tag)) {
      continue;
    }
    const isAnOfficialTag = await isOfficialTag(tag);

    if (!isAnOfficialTag) {
      allCustomTags.add(tag);
    }
  }
  Storage.set(STORAGE_KEY, [...allCustomTags]);
}

export function clearCustomTags(): void {
  allCustomTags.clear();
  Storage.remove(STORAGE_KEY);
}

async function isOfficialTag(tagName: string): Promise<boolean> {
  try {
    const html = await fetchTagFromAPI(tagName);
    const dom = domParser.parseFromString(html, "text/html");
    const columnOfFirstRow = dom.getElementsByClassName("highlightable")[0].getElementsByTagName("td");
    return columnOfFirstRow.length === 3;
  } catch (error) {
    console.error(error);
    return false;
  }
}

export function addCustomTagsToAutocomplete(officialTags: AwesompleteSuggestion[], searchQuery: string): AwesompleteSuggestion[] {
  const customTags = Array.from(allCustomTags);
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
