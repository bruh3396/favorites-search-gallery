import { AwesompleteSuggestion } from "../../../../types/ui";
import { Storage } from "../../../../lib/core/storage/storage_instance";
import { domParser } from "../../../../utils/dom/dom_parser";
import { fetchTagFromAPI } from "../../../../lib/server/fetch/tag_fetcher";
import { removeExtraWhiteSpace } from "../../../../utils/string/format";

const allCustomTags: Set<string> = loadCustomTags();

export function loadCustomTags(): Set<string> {
  return new Set(Storage.get<string[]>("customTags") ?? []);
}

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
  Storage.set("customTags", [...allCustomTags]);
}

export function clearCustomTags(): void {
  allCustomTags.clear();
  Storage.remove("customTags");
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
