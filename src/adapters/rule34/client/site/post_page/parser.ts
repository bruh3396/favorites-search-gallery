import { Post } from "@/core/domain/post/post";
import { PostFetchError } from "@/types/errors";
import { TagCategoryMap } from "@/types/search";
import { isTagCategory } from "@/lib/domain/tag/category_codec";
import { removeExtraWhitespace } from "@/utils/pure/string";
import { withRule34Hostname } from "@/lib/media/url";

export type PostPage = {
  post: Post;
  tagCategories: TagCategoryMap;
};

const statisticRegex = /(\S+):\s+(\S+)/g;
const sizeRegex = /^([1-9]\d*)(?:x|\/)([1-9]\d*)$/;

export function parsePostFromPostPage(html: string): PostPage {
  const dom = new DOMParser().parseFromString(html, "text/html");
  const statistics = getStatistics(dom);
  const fileUrl = getFileUrl(dom);
  const tags = getTags(dom);
  const rating = getRating(statistics);
  const dimensions = parseDimensions(statistics.size);
  return {
    post: {
      id: statistics.id,
      width: dimensions.width,
      height: dimensions.height,
      score: Number(statistics.score),
      rating,
      change: 0,
      deleted: true,
      duration: 0,
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

function parseDimensions(size: string | undefined): { width: number; height: number } {
  const match = sizeRegex.exec(size ?? "");

  if (match === null) {
    throw new PostFetchError(`post page has no size: ${String(size)}`);
  }
  return { width: Number(match[1]), height: Number(match[2]) };
}

function getFileUrl(dom: Document): string {
  const image = dom.querySelector("#image");
  return image instanceof HTMLImageElement ? withRule34Hostname(image.src) : "";
}

function getTags(dom: Document): string {
  return removeExtraWhitespace(Array.from(dom.querySelectorAll(".tag>a"))
    .filter(anchor => anchor instanceof HTMLAnchorElement && anchor.textContent !== "?")
    .map(anchor => (anchor.textContent || "").replaceAll(" ", "_"))
    .join(" ") || "");
}

function getRating(statistics: Record<string, string>): string {
  if (statistics.rating === undefined || statistics.rating === "") {
    return "e";
  }
  return statistics.rating.charAt(0).toLowerCase();
}
