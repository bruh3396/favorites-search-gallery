import { DomEvents } from "@/app/dom/events";

export function toggleGlobalInputEvents(value: boolean): void {
  for (const event of Object.values(DomEvents.document)) {
    event.toggle(value);
  }
}
