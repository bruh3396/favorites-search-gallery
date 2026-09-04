import { toSortedTagSet, toSortedTagString, toTagString } from "@/utils/pure/tag";

export class FavoriteTags {
  public tags: Set<string> = new Set();
  private baseTags: Set<string> = new Set();
  private addedTags: Set<string> = new Set();

  constructor(baseTags: Set<string>, addedTags?: Set<string>) {
    this.set(baseTags, addedTags);
  }

  public get tagString(): string {
    return toTagString(this.tags);
  }

  public get addedTagString(): string | undefined {
    return this.addedTags.size === 0 ? undefined : toSortedTagString(this.addedTags);
  }

  public set(tags: Set<string>, addedTags?: Set<string>): void {
    this.baseTags = tags;

    if (addedTags !== undefined) {
      this.addedTags = addedTags;
    }
    this.mergeTags();
  }

  public addTags(newTagString: string): string {
    const newTags = toSortedTagSet(newTagString).difference(this.tags);

    if (newTags.size > 0) {
      this.addedTags = this.addedTags.union(newTags);
      this.mergeTags();
    }
    return toSortedTagString(this.addedTags);
  }

  public removeAddedTags(tagsToRemove: string): string {
    const tagsToRemoveSet = toSortedTagSet(tagsToRemove).intersection(this.addedTags);

    if (tagsToRemoveSet.size > 0) {
      this.addedTags = this.addedTags.difference(tagsToRemoveSet);
      this.mergeTags();
    }
    return toSortedTagString(this.addedTags);
  }

  public resetAddedTags(): void {
    if (this.addedTags.size === 0) {
      return;
    }
    this.addedTags = new Set();
    this.mergeTags();
  }

  private mergeTags(): void {
    if (this.addedTags.size === 0) {
      this.tags = this.baseTags;
      return;
    }
    this.tags = new Set(Array.from(this.baseTags.union(this.addedTags)).sort());
  }
}
