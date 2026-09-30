import * as SnippetFailure from "@/features/favorites/features/snippets/model/failure";
import * as SnippetIdQuery from "@/features/favorites/features/snippets/model/id_query";
import * as SnippetListing from "@/features/favorites/features/snippets/model/listing";
import * as SnippetTransfer from "@/features/favorites/features/snippets/model/transfer";
import { SerializedSnippet, Snippet, SnippetFailureReason, SnippetResult } from "@/features/favorites/features/snippets/types/types";
import { LocalKeyedValues } from "@/core/boundary/ports/local_keyed_values";
import { SnippetStore } from "@/features/favorites/features/snippets/model/store";

export class SnippetModel {
  private readonly store: SnippetStore;

  constructor(storage: LocalKeyedValues) {
    this.store = new SnippetStore(storage);
  }

  public getSnippet(name: string): Snippet | undefined {
    return this.store.get(name);
  }

  public getAllSnippets(): Snippet[] {
    return this.store.getAll();
  }

  public countSnippets(): number {
    return this.store.getAll().length;
  }

  public listSnippets(filterText: string): Snippet[] {
    return SnippetListing.filterSnippets(SnippetListing.sortByNewest(this.store.getAll()), filterText);
  }

  public emptyText(): string {
    return SnippetListing.emptyText(this.store.getAll());
  }

  public addSnippet(name: string, query: string): SnippetResult {
    return this.store.add(name, query);
  }

  public updateSnippet(oldName: string, name: string, query: string): SnippetResult {
    return this.store.update(oldName, name, query);
  }

  public removeSnippet(name: string): void {
    this.store.remove(name);
  }

  public useSnippet(name: string): void {
    this.store.use(name);
  }

  public moveSnippetToTop(name: string): void {
    this.store.moveToTop(name);
  }

  public replaceAllSnippets(entries: SerializedSnippet[]): number {
    return this.store.replaceAll(entries);
  }

  public describeFailure(reason: SnippetFailureReason, name: string): string {
    return SnippetFailure.describe(reason, name);
  }

  public buildIdQuery(ids: string[]): string {
    return SnippetIdQuery.build(ids);
  }

  public serializeSnippets(): Blob {
    return SnippetTransfer.serialize(this.store.getAll());
  }

  public parseSnippets(contents: string): SerializedSnippet[] {
    return SnippetTransfer.parse(contents);
  }
}
