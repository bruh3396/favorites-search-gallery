import * as SearchPageNavigationFlow from "../flows/search_page_navigation_flow";
import { Events } from "../../../../lib/global/events/events";

export function addSearchPageEventListeners(): void {
  Events.gallery.navigateSearchPages.on(SearchPageNavigationFlow.navigateSearchPages);
}
