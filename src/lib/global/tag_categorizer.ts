import * as API from "../api/api";
import { TagCategory, TagCategoryMapping } from "../../types/common_types";
import { BatchExecutor } from "../components/batch_executor";
import { Database } from "../components/database";
import { Favorite } from "../../types/favorite_types";
import { getTagSetFromItem } from "../../utils/dom/tags";
import { replaceSpacesWithUnderscores } from "../../utils/primitive/string";

const MAPPINGS: Record<string, TagCategory> = {};
const PENDING_MAPPINGS: Record<string, Promise<TagCategoryMapping>> = {};
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

export async function setupTagCategorizer(): Promise<void> {
  const mappings = await DATABASE.load();

  for (const mapping of mappings) {
    MAPPINGS[mapping.id] = mapping.category;
  }
}

export function getTagCategoriesFromItems(items: HTMLElement[] | Favorite[]): Promise<TagCategoryMapping[][]> {
  return Promise.all(items.map(item => getTagCategoriesFromItem(item)));
}

export function getTagCategoriesFromItem(item: HTMLElement | Favorite): Promise<TagCategoryMapping[]> {
  const tagSet = getTagSetFromItem(item);

  tagSet.delete(item.id);
  return getTagCategories(tagSet).catch(() => {
    return getTagCategoriesFromPostPage(item.id);
  });
}

function getTagCategories(tags: Set<string> | string[]): Promise<TagCategoryMapping[]> {
  return Promise.all(Array.from(tags).map((tag) => getTagCategory(tag)));
}

function getTagCategory(tag: string): Promise<TagCategoryMapping> {
  if (tag in MAPPINGS) {
    return Promise.resolve({ id: tag, category: MAPPINGS[tag] });
  }

  if (tag in PENDING_MAPPINGS) {
    return PENDING_MAPPINGS[tag];
  }

  const promise = (async(): Promise<TagCategoryMapping> => {
    const mapping = await fetchTagCategory(tag);

    saveTagCategoryMapping(mapping);
    delete PENDING_MAPPINGS[tag];
    return mapping;
  })();

  PENDING_MAPPINGS[tag] = promise;
  return promise;
}

async function fetchTagCategory(tag: string): Promise<TagCategoryMapping> {
  const html = await API.fetchTagFromAPI(tag);
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
  return mapping;
}

function saveTagCategoryMapping(mapping: TagCategoryMapping): void {
  if (mapping.id in MAPPINGS) {
    return;
  }
  MAPPINGS[mapping.id] = mapping.category;
  DATABASE_WRITE_SCHEDULER.add(mapping);
}

async function getTagCategoriesFromPostPage(id: string): Promise<TagCategoryMapping[]> {
  const mappings = getTagCategoryMapFromPostPage(await API.fetchPostPage(id));

  for (const mapping of mappings) {
    saveTagCategoryMapping(mapping);
  }
  return mappings;
}

function getTagCategoryMapFromPostPage(html: string): TagCategoryMapping[] {
  const dom = new DOMParser().parseFromString(html, "text/html");
  return Array.from(dom.querySelectorAll(".tag")).map(element => extractTagCategoryFromPostPageElement(element));
}

function extractTagCategoryFromPostPageElement(element: Element): TagCategoryMapping {
  let category: TagCategory = element.classList[0].replace("tag-type-", "") as TagCategory;
  const tagName = replaceSpacesWithUnderscores(element.children[1].textContent || "");

  if (category !== "general" && category !== "artist" && category !== "unknown" &&
    category !== "copyright" && category !== "character" && category !== "metadata") {
    category = "general";
  }
  return { id: tagName, category };
}
