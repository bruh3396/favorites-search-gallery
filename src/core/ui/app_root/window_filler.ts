import { SizeObserver } from "@/core/boundary/ports/size_observer/size_observer";

export interface WindowFill {
  refit: () => void;
  dispose: () => void;
}

export function fillWindow(element: HTMLElement, sizeObserver: SizeObserver): WindowFill {
  const page = element.ownerDocument.documentElement;
  const refit = (): void => {
    const top = element.getBoundingClientRect().top + page.scrollTop;

    element.style.blockSize = `calc(100dvh - ${top}px)`;
  };

  refit();
  return { refit, dispose: sizeObserver.observe(page, refit) };
}
