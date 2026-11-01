import { TagCategory, isTagCategory } from "@/core/domain/tag_category/tag_category";
import { CategorizedPost } from "@/core/domain/post/categorized_post";
import { Media } from "@/core/domain/media/media";
import { MediaMinter } from "@/core/domain/media/media_minter";
import { Rating } from "@/core/domain/post/rating";
import { Rule34Error } from "@/adapters/rule34/client/rule34_error";
import { removeExtraWhitespace } from "@/core/utils/string/string_utilities";

const STATISTIC_ENTRY = /(\S+):\s+(\S+)/g;
const DIMENSIONS = /^([1-9]\d*)(?:x|\/)([1-9]\d*)$/;
const TAG_TYPE = /\btag-type-(\S+)/;
const RATING_BY_INITIAL: Partial<Record<string, Rating>> = { e: "explicit", q: "questionable", s: "safe" };

export function parseRule34PostPage(html: string, mintMedia: MediaMinter): CategorizedPost {
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
      status: "deleted",
      tags,
      media: parseMedia(dom, { tags, mintMedia })
    },
    tagCategories: parseTagCategories(dom)
  };
}

function parseTagCategories(dom: Document): ReadonlyMap<string, TagCategory> {
  const categoryMap = new Map<string, TagCategory>();

  for (const tag of [...dom.querySelectorAll(".tag")]) {
    const category = TAG_TYPE.exec(tag.className)?.[1] ?? "general";
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

function parseMedia(dom: Document, { tags, mintMedia }: { tags: string; mintMedia: MediaMinter }): Media {
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

function parseRating(statistics: Record<string, string>): Rating {
  return RATING_BY_INITIAL[statistics.rating?.charAt(0).toLowerCase() ?? ""] ?? "explicit";
}
