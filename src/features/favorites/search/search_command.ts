import {createSearchTagGroup, sortSearchTagGroup} from "./utils";
import {extractTagGroups, isEmptyString} from "../../../utils/primitive/string";
import {SearchTag} from "./search_tag";
import {Searchable} from "../types/favorite/interfaces";

export class SearchCommand {
  private orGroups: SearchTag[][] = [];
  private remainingTags: SearchTag[] = [];
  private readonly isEmpty: boolean;

  get tagGroups(): { orGroups: SearchTag[][]; remainingTags: SearchTag[] } {
    return {
      orGroups: this.orGroups,
      remainingTags: this.remainingTags
    };
  }

  constructor(searchQuery: string) {
    this.isEmpty = isEmptyString(searchQuery);

    if (this.isEmpty) {
      return;
    }
    const {orGroups, remainingTags} = extractTagGroups(searchQuery);

    this.orGroups = orGroups.map(orGroup => createSearchTagGroup(orGroup));
    this.remainingTags = createSearchTagGroup(remainingTags);
    this.simplifyOrGroupsWithOnlyOneTag();
    this.sortOrGroupsByLength();
  }

  public getSearchResults<T extends Searchable>(items: T[]): T[] {
    return this.isEmpty ? items : items.filter(item => this.matches(item));
  }

  private matches(item: Searchable): boolean {
    return this.matchesAllRemainingTags(item) && this.matchesAllOrGroups(item);
  }

  private matchesAllRemainingTags(item: Searchable): boolean {
    return this.remainingTags.every(tag => tag.matches(item));
  }

  private matchesAllOrGroups(item: Searchable): boolean {
    return this.orGroups.every(orGroup => orGroup.some(tag => tag.matches(item)));
  }

  private simplifyOrGroupsWithOnlyOneTag(): void {
    this.orGroups = this.orGroups.filter(orGroup => {
      if (orGroup.length === 1) {
        this.remainingTags.push(orGroup[0]);
        return false;
      }
      return true;
    });
    sortSearchTagGroup(this.remainingTags);
  }

  private sortOrGroupsByLength(): void {
    this.orGroups.sort((a, b) => {
      return a.length - b.length;
    });
  }
}
