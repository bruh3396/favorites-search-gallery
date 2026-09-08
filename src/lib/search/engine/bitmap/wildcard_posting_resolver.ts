import { WildcardMatchType, WildcardSearchTerm } from "@/lib/search/terms/wildcard_search_term";
import { Posting } from "@/lib/search/engine/bitmap/posting";
import { PrefixIndex } from "@/lib/search/index/prefix_index";
import { TrigramIndex } from "@/lib/search/index/trigram_index";

interface Entry {
  readonly term: string;
  readonly posting: Posting;
}

const NO_MATCH = Symbol("no-match");

const keyOf = (entry: Entry): string => entry.term;

export class WildcardPostingResolver {
  private prefixes = new PrefixIndex<Entry>([], keyOf);
  private trigrams = new TrigramIndex<Entry>([], keyOf);
  private byTerm = new Map<string, Entry>();
  private readonly cache = new Map<string, Posting | typeof NO_MATCH>();

  constructor(private readonly unionize: (postings: Posting[]) => Posting) { }

  public index(entries: Entry[]): void {
    this.prefixes = new PrefixIndex<Entry>(entries, keyOf);
    this.trigrams = new TrigramIndex<Entry>(entries, keyOf);
    this.byTerm = new Map(entries.map(entry => [entry.term, entry]));
    this.cache.clear();
  }

  public refresh(term: string, posting: Posting | undefined): void {
    const existing = this.byTerm.get(term);

    if (existing !== undefined) {
      this.prefixes.remove(existing);
      this.trigrams.remove(existing);
      this.byTerm.delete(term);
    }

    if (posting !== undefined) {
      const entry: Entry = { term, posting };

      this.prefixes.add(entry);
      this.trigrams.add(entry);
      this.byTerm.set(term, entry);
    }
    this.cache.clear();
  }

  public resolve(term: WildcardSearchTerm): Posting | undefined {
    const inputs = term.resolutionInputs;

    switch (inputs.matchType) {
      case WildcardMatchType.Prefix:
        return this.cached(`^${inputs.fragment}`, () => this.prefixes.matchingPrefix(inputs.fragment));
      case WildcardMatchType.Suffix:
        return this.cached(`${inputs.fragment}$`, () => this.filtered(inputs.fragment, entry => entry.term.endsWith(inputs.fragment)));
      case WildcardMatchType.Substring:
        return this.cached(`*${inputs.fragment}*`, () => this.filtered(inputs.fragment, entry => entry.term.includes(inputs.fragment)));
      default:
        return this.cached(`~${inputs.regex.source}`, () => this.filteredAll(inputs.fragments, entry => inputs.regex.test(entry.term)));
    }
  }

  private filtered(fragment: string, matches: (entry: Entry) => boolean): Entry[] {
    return this.trigrams.matching(fragment, this.prefixes.all()).filter(matches);
  }

  private filteredAll(fragments: string[], matches: (entry: Entry) => boolean): Entry[] {
    return this.trigrams.matchingAll(fragments, this.prefixes.all()).filter(matches);
  }

  private cached(key: string, resolveEntries: () => Entry[]): Posting | undefined {
    const hit = this.cache.get(key);

    if (hit !== undefined) {
      return hit === NO_MATCH ? undefined : hit;
    }
    const entries = resolveEntries();
    const union = entries.length === 0 ? NO_MATCH : this.unionize(entries.map(entry => entry.posting));

    this.cache.set(key, union);
    return union === NO_MATCH ? undefined : union;
  }
}
