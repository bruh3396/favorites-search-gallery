import { ParsedPost, ServerPost } from "@/types/api";
import { TagCategoryMap } from "@/types/search";

export function parsePost(post: ServerPost): ParsedPost {
  const tagCategories: TagCategoryMap = new Map(Object.entries(post.tagCategoryByName));
  return {
    post: {
      id: post.id,
      width: post.width,
      height: post.height,
      score: post.score,
      rating: post.rating,
      change: post.changedAt,
      fileURL: toFileUrl(post),
      previewURL: toPreviewUrl(post),
      tags: [...tagCategories.keys()].join(" "),
      deleted: false,
      duration: 0
    },
    tagCategories
  };
}

function toFileUrl({ directory, stem, extension }: ServerPost): string {
  const host = extension === "mp4" ? "api-cdn-mp4" : "api-cdn";
  return `https://${host}.rule34.xxx/images/${directory}/${stem}.${extension}`;
}

function toPreviewUrl({ directory, stem }: ServerPost): string {
  return `https://api-cdn.rule34.xxx/thumbnails/${directory}/thumbnail_${stem}.jpg`;
}
