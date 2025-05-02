import {FavoriteItem} from "../../../types/favorite/favorite_item";
import {InvertedSearchIndex} from "./inverted_search_index";

export const FAVORITES_SEARCH_INDEX: InvertedSearchIndex<FavoriteItem> = new InvertedSearchIndex<FavoriteItem>();
