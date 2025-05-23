import { getDimensions2D, removeExtraWhiteSpace } from "../../utils/primitive/string";
import { Post } from "../../types/api/post";
import { cleanImageSource } from "../../utils/content/url";

  const PARSER = new DOMParser();
  const STATISTICS_REGEX = /(\S+):\s+(\S+)/g;

  function getStatistics(dom: Document): Record<string, string> {
    const stats = dom.querySelector("#stats");

    if (stats === null) {
      return {};
    }
    const textContent = removeExtraWhiteSpace(stats.textContent || "");
    const matches = Array.from(textContent.matchAll(STATISTICS_REGEX));
    const entries = matches.map(match => [match[1].toLowerCase(), match[2]]);
    return Object.fromEntries(entries);
  }

  function getFileURL(dom: Document): string {
    const image = dom.querySelector("#image");
    return image instanceof HTMLImageElement ? cleanImageSource(image.src) : "";
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

  function hasComments(dom: Document): boolean {
    return Array.from(dom.querySelectorAll("#comments>div")).length > 0;
  }

 export function parsePostFromPostPage(html:string): Post {
    const dom = PARSER.parseFromString(html, "text/html");
    const statistics = getStatistics(dom);
    const fileURL = getFileURL(dom);
    const tags = getTags(dom);
    const rating = getRating(statistics);
    const dimensions = getDimensions2D(statistics.size);
    const hasNotes = statistics.notes !== undefined && statistics.notes !== "0";
    const hasCommentsValue = hasComments(dom);
    return {
      id: statistics.id,
      height: dimensions.height,
      score: Number(statistics.score),
      fileURL,
      parentId: "",
      sampleURL: "",
      sampleWidth: 0,
      sampleHeight: 0,
      previewURL: "",
      rating,
      tags,
      width: dimensions.width,
      change: 0,
      md5: "",
      creatorId: "",
      hasChildren: false,
      createdAt: statistics.posted,
      status: "active",
      source: statistics.source,
      hasNotes,
      hasComments: hasCommentsValue,
      previewWidth: 0,
      previewHeight: 0
    };
 }
