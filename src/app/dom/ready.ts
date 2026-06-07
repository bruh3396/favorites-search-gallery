import { DomEvents } from "@/app/dom/events";

export function waitForDomToLoad(): Promise<void> {
  return new Promise((resolve) => {
    DomEvents.document.domLoaded.on(() => resolve(), { once: true });
  });
}
