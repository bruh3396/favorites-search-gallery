import { TagCategory, TagCategoryMapping } from "../../types/common_types";
import { fetchPostPage, fetchTagFromAPI } from "../api/api";
import { BatchExecutor } from "../components/batch_executor";
import { Database } from "../components/database";
import { getTagSetFromThumb } from "../../utils/dom/tags";
import { replaceSpacesWithUnderscores } from "../../utils/primitive/string";

const MAPPINGS: Record<string, TagCategory> = {};
const DECODINGS: Record<number, TagCategory> = {
  0: "general",
  1: "artist",
  2: "unknown",
  3: "copyright",
  4: "character",
  5: "metadata"
};
const DATABASE = new Database<TagCategoryMapping>("TagCategories", "tagMappings");
const PARSER = new DOMParser();
const DATABASE_WRITE_SCHEDULER = new BatchExecutor<TagCategoryMapping>(500, 2000, DATABASE.update.bind(DATABASE));

export function getTagCategoriesFromThumb(thumb: HTMLElement): Promise<TagCategoryMapping[]> {
  const tagSet = getTagSetFromThumb(thumb);

  tagSet.delete(thumb.id);
  return getTagCategories(tagSet).catch(() => {
    return getTagCategoriesFromPostPage(thumb.id);
  });
}

function getTagCategories(tags: Set<string> | string[]): Promise<TagCategoryMapping[]> {
  return Promise.all(Array.from(tags).map((tag) => getTagCategory(tag)));
}

function getTagCategory(tag: string): Promise<TagCategoryMapping> {
  const category = MAPPINGS[tag];

  if (category !== undefined) {
    return Promise.resolve({
      id: tag,
      category
    });
  }
  return fetchTagCategory(tag);
}

async function fetchTagCategory(tag: string): Promise<TagCategoryMapping> {
  const html = await fetchTagFromAPI(tag);
  const dom = PARSER.parseFromString(html, "text/html");
  const tagElement = dom.querySelector("tag");

  if (tagElement === null) {
    throw new Error(`Tag ${tag} not found in API response`);
  }
  const type = tagElement.getAttribute("type");

  if (type === null || type === "array") {
    throw new Error(`Tag ${tag} not found in API response`);
  }
  const category = DECODINGS[parseInt(type)] ?? "general";
  const mapping: TagCategoryMapping = {
    id: tag,
    category
  };

  saveTagCategoryMapping(mapping);
  return mapping;
}

function saveTagCategoryMapping(mapping: TagCategoryMapping): void {
  MAPPINGS[mapping.id] = mapping.category;
  DATABASE_WRITE_SCHEDULER.add(mapping);
}

async function getTagCategoriesFromPostPage(id: string): Promise<TagCategoryMapping[]> {
  const html = await fetchPostPage(id);
  return getTagCategoryMapFromPostPage(html);
}

function getTagCategoryMapFromPostPage(html: string): TagCategoryMapping[] {
  const dom = new DOMParser().parseFromString(html, "text/html");
  return Array.from(dom.querySelectorAll(".tag")).map(element => extractTagCategory(element));
}

function extractTagCategory(element: Element): TagCategoryMapping {
  let category: TagCategory = element.classList[0].replace("tag-type-", "") as TagCategory;
  const tagName = replaceSpacesWithUnderscores(element.children[1].textContent || "");

  if (category !== "general" && category !== "artist" && category !== "unknown" &&
    category !== "copyright" && category !== "character" && category !== "metadata") {
    category = "general";
  }
  return { id: tagName, category };
}
