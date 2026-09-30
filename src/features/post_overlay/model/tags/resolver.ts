import { Ports } from "@/core/boundary/ports/ports";
import { TagCategoryMap } from "@/core/domain/tag/tag";

type TagCategoryPorts = Pick<Ports, "localTagCategories" | "remoteTagCategories">;

export async function resolveAll(ports: TagCategoryPorts, postId: string, tags: Set<string>): Promise<TagCategoryMap> {
  const tagNames = [...tags].filter(tag => tag !== postId);
  const stored = await ports.localTagCategories.getMany(tagNames);
  const fetched = await fetchMissing(ports, tagNames.filter(tagName => !stored.has(tagName)));
  return new Map(tagNames.map(tagName => [tagName, stored.get(tagName) ?? fetched.get(tagName) ?? "general"]));
}

async function fetchMissing(ports: TagCategoryPorts, tagNames: string[]): Promise<TagCategoryMap> {
  if (tagNames.length === 0) {
    return new Map();
  }

  try {
    const fetched = await ports.remoteTagCategories.fetch(tagNames);

    await ports.localTagCategories.setMany(fetched);
    return fetched;
  } catch (error) {
    console.error(error);
    return new Map();
  }
}
