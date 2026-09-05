import { toSortedTagSet, toTagString } from "@/utils/pure/tag";
import { ParsedPost } from "@/types/api";
import { TagCategoryMap } from "@/types/search";
import { isTagCategory } from "@/types/guards";
import { removeExtraWhitespace } from "@/utils/pure/string";
import { toDimensions2D } from "@/utils/pure/geometry";
import { withRule34Hostname } from "@/lib/media/url";

const statisticRegex = /(\S+):\s+(\S+)/g;

export function parsePostFromPostPage(html: string): ParsedPost {
  const dom = new DOMParser().parseFromString(html, "text/html");
  const statistics = getStatistics(dom);
  const fileUrl = getFileUrl(dom);
  const tags = getTags(dom);
  const rating = getRating(statistics);
  const dimensions = toDimensions2D(statistics.size);
  return {
    post: {
      id: statistics.id,
      width: dimensions.x,
      height: dimensions.y,
      score: Number(statistics.score),
      rating,
      change: 0,
      tags,
      fileURL: fileUrl,
      previewURL: ""
    },
    tagCategories: parseTagCategories(dom)
  };
}

export function parseTagCategoriesFromPostPage(html: string): TagCategoryMap {
  return parseTagCategories(new DOMParser().parseFromString(html, "text/html"));
}

function parseTagCategories(dom: Document): TagCategoryMap {
  const categoryMap: TagCategoryMap = new Map();

  for (const tag of Array.from(dom.querySelectorAll(".tag"))) {
    const category = tag.classList[0]?.replace("tag-type-", "") ?? "";
    const name = (tag.children[1]?.textContent ?? "").replaceAll(" ", "_");

    if (name === "") {
      continue;
    }
    categoryMap.set(name, isTagCategory(category) ? category : "general");
  }
  return categoryMap;
}

function getStatistics(dom: Document): Record<string, string> {
  const stats = dom.querySelector("#stats");

  if (stats === null) {
    return {};
  }
  const textContent = removeExtraWhitespace(stats.textContent || "");
  const matches = Array.from(textContent.matchAll(statisticRegex));
  const entries = matches.map(match => [match[1].toLowerCase(), match[2]]);
  return Object.fromEntries(entries);
}

function getFileUrl(dom: Document): string {
  const image = dom.querySelector("#image");
  return image instanceof HTMLImageElement ? withRule34Hostname(image.src) : "";
}

function getTags(dom: Document): string {
  const tags = removeExtraWhitespace(Array.from(dom.querySelectorAll(".tag>a"))
    .filter(anchor => anchor instanceof HTMLAnchorElement && anchor.textContent !== "?")
    .map(anchor => (anchor.textContent || "").replaceAll(" ", "_"))
    .join(" ") || "");
  return toTagString(toSortedTagSet(tags));
}

function getRating(statistics: Record<string, string>): string {
  if (statistics.rating === undefined || statistics.rating === "") {
    return "e";
  }
  return statistics.rating.charAt(0).toLowerCase();
}
