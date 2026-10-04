import { Post } from "@/core/domain/post/post";

const TAGS = ["apple", "banana", "cherry", "durian", "elderberry", "fig", "grape", "kiwi", "lemon", "mango", "orange", "peach"];
const RATINGS = ["s", "q", "e"];
const SIZES = [[640, 480], [480, 640], [800, 450], [600, 600]];

function tagsFor(index: number): string {
  return [...TAGS.filter((_tag, tagIndex) => (index + 1) % (tagIndex + 2) === 0), TAGS[index % TAGS.length]].join(" ");
}

function imageFor(id: number, width: number, height: number): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">` +
    `<rect width="100%" height="100%" fill="hsl(${(id * 47) % 360} 60% 55%)"/>` +
    `<text x="50%" y="50%" font-size="${Math.round(height / 4)}" text-anchor="middle" dominant-baseline="middle" fill="white">${id}</text>` +
    "</svg>";
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

export function createSamplePosts(count: number): Post[] {
  return Array.from({ length: count }, (_value, index) => {
    const id = count - index;
    const [width, height] = SIZES[id % SIZES.length];
    return {
      id: String(id),
      tags: tagsFor(id),
      width,
      height,
      score: (id * 7) % 100,
      rating: RATINGS[id % RATINGS.length],
      changedAt: id,
      media: { kind: "image", locator: imageFor(id, width, height) }
    };
  });
}
