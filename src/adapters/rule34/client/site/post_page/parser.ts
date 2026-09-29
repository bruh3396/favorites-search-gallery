import { CategorizedPost } from "@/core/domain/post/post";
import { Media } from "@/core/domain/media/media";
import { PostFetchError } from "@/types/errors";
import { TagCategoryMap } from "@/core/domain/tag/tag";
import { isTagCategory } from "@/lib/domain/tag/category_codec";
import { mintMedia } from "@/adapters/rule34/client/media/locator";
import { removeExtraWhitespace } from "@/utils/pure/string";

const statisticRegex = /(\S+):\s+(\S+)/g;
const sizeRegex = /^([1-9]\d*)(?:x|\/)([1-9]\d*)$/;

export function parsePostFromPostPage(html: string): CategorizedPost {
  const dom = new DOMParser().parseFromString(html, "text/html");
  const statistics = getStatistics(dom);
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
      media: parseMedia(dom, tags)
    },
    tagCategories: parseTagCategories(dom)
  };
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

function parseMedia(dom: Document, tags: string): Media {
  const file = dom.querySelector("#image")?.getAttribute("src") ?? dom.querySelector("video source")?.getAttribute("src") ?? "";
  const media = mintMedia(file, tags);

  if (media === null) {
    throw new PostFetchError(`post page has no file: ${file}`);
  }
  return media;
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
