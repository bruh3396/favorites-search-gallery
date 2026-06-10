import { Post } from "@/types/api";
import { TagCategoryMap } from "@/types/search";
import { isTagCategory } from "@/types/guards";
import { withRule34Hostname } from "@/lib/media/url_transformer";
import { parseDimensions2D } from "@/utils/string/parse";
import { parseHtml } from "@/utils/dom/html_parser";
import { removeExtraWhiteSpace } from "@/utils/string/format";

const statisticRegex = /(\S+):\s+(\S+)/g;

export function parsePostFromPostPage(html: string): Post {
  const dom = parseHtml(html);
  const statistics = getStatistics(dom);
  const fileUrl = getFileUrl(dom);
  const tags = getTags(dom);
  const rating = getRating(statistics);
  const dimensions = parseDimensions2D(statistics.size);
  return {
    id: statistics.id,
    width: dimensions.x,
    height: dimensions.y,
    score: Number(statistics.score),
    rating,
    change: 0,
    tags,
    fileURL: fileUrl,
    previewURL: "",
    tagCategories: new Map()
  };
}

export function parseTagCategoriesFromPostPage(html: string): TagCategoryMap {
  const dom = parseHtml(html);
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
  const textContent = removeExtraWhiteSpace(stats.textContent || "");
  const matches = Array.from(textContent.matchAll(statisticRegex));
  const entries = matches.map(match => [match[1].toLowerCase(), match[2]]);
  return Object.fromEntries(entries);
}

function getFileUrl(dom: Document): string {
  const image = dom.querySelector("#image");
  return image instanceof HTMLImageElement ? withRule34Hostname(image.src) : "";
}

function getTags(dom: Document): string {
  return removeExtraWhiteSpace(Array.from(dom.querySelectorAll(".tag>a"))
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
