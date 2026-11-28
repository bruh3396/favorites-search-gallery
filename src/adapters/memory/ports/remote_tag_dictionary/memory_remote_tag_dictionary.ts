import { RemoteTagDictionary } from "@/core/boundary/ports/remote_tag_dictionary/remote_tag_dictionary";
import { TagCategory } from "@/core/domain/tag_category/tag_category";

export class MemoryRemoteTagDictionary implements RemoteTagDictionary {
  constructor(private readonly tagDictionary: ReadonlyMap<string, TagCategory> = new Map()) { }

  public fetch(): Promise<ReadonlyMap<string, TagCategory>> {
    return Promise.resolve(this.tagDictionary);
  }
}
