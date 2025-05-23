import { setupCommonStyles } from "../../utils/dom/style";
import { setupEvents } from "../globals/events";
import { setupExtensions } from "../../store/indexed_db/extensions";
import { setupGlobalQueues } from "../globals/fetch_queues";

export function setupGlobals(): void {
  setupEvents();
  setupExtensions();
  setupCommonStyles();
  setupGlobalQueues();
}
