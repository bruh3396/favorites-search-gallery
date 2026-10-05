import { AbstractSearchTerm } from "@/core/search/terms/abstract_search_term";

export interface SearchTermHighlight {
  tags: AbstractSearchTerm[];
  lightColor: string;
  darkColor: string;
}
