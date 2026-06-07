export function extractNativeFavorites(): HTMLElement[] | undefined {
  const container = document.querySelector<HTMLElement>("#content, div:has(.thumb)");

  if (container === null) {
    return undefined;
  }
  const thumbs = Array.from(container.querySelectorAll(".thumb")) as HTMLElement[];

  container.remove();
  return thumbs;
}

export function removeUnusedScripts(): void {
  for (const script of document.querySelectorAll("script")) {
    if ((/(?:fluidplayer|awesomplete)/).test(script.src ?? "")) {
      script.remove();
    }
  }
}
