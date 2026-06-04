import { IconName, icon } from "@/lib/ui/icon";
import { PostOverlayClass } from "@/features/post_overlay/types/css_names";
import { PostOverlayConfig } from "@/config/post_overlay_config";
import { TagCategory } from "@/types/search";

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

  if (PostOverlayConfig.tagHints) {
    target.appendChild(buildHint());
  }
}

function tagNamesInCategory(categories: Map<string, TagCategory>, category: TagCategory): string[] {
  return Array.from(categories.keys()).filter(tagName => categories.get(tagName) === category);
}

function buildGroup(category: string, label: string, items: string[]): HTMLElement {
  const group = document.createElement("div");

  group.className = PostOverlayClass.group;
  group.dataset.category = category;
  group.appendChild(buildLabel(label));
  items.forEach(item => group.appendChild(buildTag(category, item)));
  return group;
}

function buildLabel(label: string): HTMLElement {
  const element = document.createElement("span");

  element.className = PostOverlayClass.groupLabel;
  element.textContent = label;
  return element;
}

function buildTag(category: string, item: string): HTMLElement {
  const tag = document.createElement("span");

  tag.className = PostOverlayClass.tag;
  tag.dataset.category = category;
  tag.dataset.tag = item;
  tag.textContent = item.replaceAll("_", " ");
  return tag;
}

function buildHint(): HTMLElement {
  const hint = document.createElement("span");

  hint.className = PostOverlayClass.hint;
  hint.append(
    buildHintItem("leftClick", "add"),
    buildHintItem("rightClick", "exclude"),
    buildHintItem("middleClick", "search")
  );
  return hint;
}

function buildHintItem(iconName: IconName, label: string): HTMLElement {
  const item = document.createElement("span");

  item.className = PostOverlayClass.hintItem;
  item.append(icon(iconName), label);
  return item;
}
