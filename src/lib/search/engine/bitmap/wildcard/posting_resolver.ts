import { Posting } from "@/lib/search/engine/bitmap/bits/posting";
import { WildcardMatcher } from "@/lib/search/indexes/wildcard_matcher";
import { WildcardSearchTerm } from "@/lib/search/query/terms/wildcard_search_term";

interface Entry {
  readonly term: string;
  posting: Posting;
}

const keyOf = (entry: Entry): string => entry.term;

export class WildcardPostingResolver {
  private matcher = new WildcardMatcher<Entry>(keyOf);
  private byTerm = new Map<string, Entry>();
  private readonly cache = new Map<string, Posting | null>();

  constructor(private readonly unionize: (postings: Posting[]) => Posting) { }

  public index(entries: Entry[]): void {
    this.matcher = new WildcardMatcher<Entry>(keyOf, entries);
    this.byTerm = new Map(entries.map(entry => [entry.term, entry]));
    this.cache.clear();
  }

  public refresh(term: string, posting: Posting | undefined): void {
    const existing = this.byTerm.get(term);

    if (existing !== undefined && posting !== undefined) {
      existing.posting = posting;
    } else if (existing !== undefined) {
      this.matcher.remove(existing);
      this.byTerm.delete(term);
    } else if (posting !== undefined) {
      const entry: Entry = { term, posting };

      this.matcher.add(entry);
      this.byTerm.set(term, entry);
    }
    this.cache.clear();
  }

  public resolve(term: WildcardSearchTerm): Posting | undefined {
    const key = term.resolutionInputs.regex.source;
    const cached = this.cache.get(key);

    if (cached !== undefined) {
      return cached ?? undefined;
    }
    const entries = this.matcher.match(term);
    const union = entries.length === 0 ? null : this.unionize(entries.map(entry => entry.posting));

    this.cache.set(key, union);
    return union ?? undefined;
  }
}
