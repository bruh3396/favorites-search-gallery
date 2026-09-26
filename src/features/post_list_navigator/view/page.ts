import { ITEM_CLASS_NAME } from "@/lib/ui/thumb/selectors";

export function removeNativeImageList(): void {
  document.querySelector(".image-list")?.replaceChildren();
}

export function currentSearch(): string {
  return document.querySelector<HTMLInputElement>("input[name=\"tags\"]")?.value ?? "";
}

export function lastItems(): HTMLElement[] {
  return Array.from(document.querySelectorAll<HTMLElement>(`.${ITEM_CLASS_NAME}:last-child`));
}
