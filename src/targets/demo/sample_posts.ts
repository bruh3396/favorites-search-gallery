import { Post } from "@/core/domain/post/post";
import { RATINGS } from "@/core/domain/post/rating";

const TAGS = ["apple", "banana", "cherry", "durian", "elderberry", "fig", "grape", "kiwi", "lemon", "mango", "orange", "peach"];
const SIZES = [[640, 480], [480, 640], [800, 450], [600, 600]];

function tagsFor(index: number): string {
  return [...TAGS.filter((_tag, tagIndex) => (index + 1) % (tagIndex + 2) === 0), TAGS[index % TAGS.length]].join(" ");
}

function imageFor(postId: number, width: number, height: number): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">` +
    `<rect width="100%" height="100%" fill="hsl(${(postId * 47) % 360} 60% 55%)"/>` +
    `<text x="50%" y="50%" font-size="${Math.round(height / 4)}" text-anchor="middle" dominant-baseline="middle" fill="white">${postId}</text>` +
    "</svg>";
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

export function createSamplePosts(count: number): Post[] {
  return Array.from({ length: count }, (_value, index) => {
    const postId = count - index;
    const [width, height] = SIZES[postId % SIZES.length];
    return {
      id: String(postId),
      tags: tagsFor(postId),
      width,
      height,
      score: (postId * 7) % 100,
      rating: RATINGS[postId % RATINGS.length],
      changedAt: postId,
      media: { kind: "image", locator: imageFor(postId, width, height) },
      status: "active"
    };
  });
}
