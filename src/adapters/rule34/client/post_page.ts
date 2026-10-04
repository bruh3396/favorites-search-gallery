import { TagCategoryMap, isTagCategory } from "@/core/domain/tag/tag";
import { BASE_INDEX_URL } from "@/adapters/rule34/client/urls";
import { CategorizedPost } from "@/core/domain/post/post";
import { Media } from "@/core/domain/media/media";
import { Rule34Error } from "@/adapters/rule34/client/error";
import { Rule34MintMedia } from "@/adapters/rule34/client/mint_media";
import { removeExtraWhitespace } from "@/utils/pure/string";

const STATISTIC_ENTRY = /(\S+):\s+(\S+)/g;
const DIMENSIONS = /^([1-9]\d*)(?:x|\/)([1-9]\d*)$/;

export function postPageUrl(id: string): string {
  return `${BASE_INDEX_URL}post&s=view&id=${id}`;
}

export function parsePostPage(html: string, mintMedia: Rule34MintMedia): CategorizedPost {
  const dom = new DOMParser().parseFromString(html, "text/html");
  const statistics = parseStatistics(dom);
  const tags = parseTags(dom);
  const rating = parseRating(statistics);
  const dimensions = parseDimensions(statistics.size);
  return {
    post: {
      id: statistics.id,
      width: dimensions.width,
      height: dimensions.height,
      score: Number(statistics.score),
      rating,
      changedAt: 0,
      deleted: true,
      tags,
      media: parseMedia(dom, { tags, mintMedia })
    },
    tagCategories: parseTagCategories(dom)
  };
}

function parseTagCategories(dom: Document): TagCategoryMap {
  const categoryMap: TagCategoryMap = new Map();

  for (const tag of [...dom.querySelectorAll(".tag")]) {
    const category = tag.classList[0]?.replace("tag-type-", "") ?? "";
    const name = (tag.children[1]?.textContent ?? "").replaceAll(" ", "_");

    if (name === "") {
      continue;
    }
    categoryMap.set(name, isTagCategory(category) ? category : "general");
  }
  return categoryMap;
}

function parseStatistics(dom: Document): Record<string, string> {
  const stats = dom.querySelector("#stats");

  if (stats === null) {
    return {};
  }
  const textContent = removeExtraWhitespace(stats.textContent || "");
  const matches = [...textContent.matchAll(STATISTIC_ENTRY)];
  const entries = matches.map(match => [match[1].toLowerCase(), match[2]]);
  return Object.fromEntries(entries);
}

function parseDimensions(size: string | undefined): { width: number; height: number } {
  const match = DIMENSIONS.exec(size ?? "");

  if (match === null) {
    throw new Rule34Error("malformed", { subject: `post page size ${String(size)}` });
  }
  return { width: Number(match[1]), height: Number(match[2]) };
}

function parseMedia(dom: Document, { tags, mintMedia }: { tags: string; mintMedia: Rule34MintMedia }): Media {
  const file = dom.querySelector("#image")?.getAttribute("src") ??
    dom.querySelector("video source")?.getAttribute("src") ??
    dom.querySelector(".link-list a[href*='/images/']")?.getAttribute("href") ??
    "";
  const media = mintMedia({ url: file, tags });

  if (media === null) {
    throw new Rule34Error("malformed", { subject: `post page file ${file}` });
  }
  return media;
}

function parseTags(dom: Document): string {
  return removeExtraWhitespace([...dom.querySelectorAll(".tag>a")]
    .filter(anchor => anchor instanceof HTMLAnchorElement && anchor.textContent !== "?")
    .map(anchor => (anchor.textContent || "").replaceAll(" ", "_"))
    .join(" ") || "");
}

function parseRating(statistics: Record<string, string>): string {
  if (statistics.rating === undefined || statistics.rating === "") {
    return "e";
  }
  return statistics.rating.charAt(0).toLowerCase();
}
