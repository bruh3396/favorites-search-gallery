import { TagCategory } from "../../../../types/search";

const DISPLAYED_CATEGORIES: readonly TagCategory[] = ["artist", "copyright", "character", "metadata"];

export function renderTags(target: HTMLElement, postId: string, categories: Map<string, TagCategory>): void {
  target.replaceChildren();
  target.appendChild(buildGroup("id", "ID", [postId]));

  for (const category of DISPLAYED_CATEGORIES) {
    const tagNames = tagNamesInCategory(categories, category);

    if (tagNames.length > 0) {
      target.appendChild(buildGroup(category, category, tagNames));
    }
  }
}

function tagNamesInCategory(categories: Map<string, TagCategory>, category: TagCategory): string[] {
  return Array.from(categories.keys()).filter(tagName => categories.get(tagName) === category);
}

function buildGroup(category: string, label: string, items: string[]): HTMLElement {
  const group = document.createElement("div");

  group.className = "post-overlay-group";
  group.dataset.category = category;
  group.appendChild(buildLabel(label));
  items.forEach(item => group.appendChild(buildTag(category, item)));
  return group;
}

function buildLabel(label: string): HTMLElement {
  const element = document.createElement("span");

  element.className = "post-overlay-group-label";
  element.textContent = label;
  return element;
}

function buildTag(category: string, item: string): HTMLElement {
  const tag = document.createElement("span");

  tag.className = "post-overlay-tag";
  tag.dataset.category = category;
  tag.textContent = item.replaceAll("_", " ");
  return tag;
}
