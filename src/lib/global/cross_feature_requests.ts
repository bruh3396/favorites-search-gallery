import { CrossFeatureRequest } from "../components/cross_feature_request";
import { NavigationKey } from "../../types/common_types";
import { SearchPage } from "../../types/search_page";

export const CrossFeatureRequests = {
  inGallery: new CrossFeatureRequest<boolean, void>(false),
  loadNewSearchPagesInGallery: new CrossFeatureRequest<SearchPage | null, NavigationKey>(null),
  loadNewFavoritesInGallery: new CrossFeatureRequest<boolean, NavigationKey>(false)
};
