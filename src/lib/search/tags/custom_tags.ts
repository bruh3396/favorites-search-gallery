import { AwesompleteSuggestion } from "../../../types/ui";
import { Storage } from "../../storage/local_storage";
import { isOfficialTag } from "./tag_validator";
import { removeExtraWhiteSpace } from "../../../utils/string/format";

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
