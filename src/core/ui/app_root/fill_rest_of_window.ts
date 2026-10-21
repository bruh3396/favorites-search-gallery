import { SizeObserver } from "@/core/boundary/ports/size_observer/size_observer";

export function fillRestOfWindow(element: HTMLElement, sizeObserver: SizeObserver): () => void {
  const page = element.ownerDocument.documentElement;
  const fit = (): void => {
    const top = element.getBoundingClientRect().top + page.scrollTop;

    element.style.blockSize = `calc(100dvh - ${top}px)`;
  };

  fit();
  // The page resizes whenever something above the element does, such as the site header hiding or wrapping.
  return sizeObserver.observe(page, fit);
}
