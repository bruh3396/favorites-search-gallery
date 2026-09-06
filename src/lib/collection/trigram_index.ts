import { intersection } from "@/utils/pure/set";
import { trigramsOf } from "@/utils/pure/string";

export class TrigramIndex {
  private readonly termsByTrigram: Map<string, Set<string>> = new Map<string, Set<string>>();

  constructor(terms: string[]) {
    for (const term of terms) {
      this.addTerm(term);
    }
  }

  public termsContaining(substring: string, corpus: string[]): string[] {
    return this.matchingTerms(substring, corpus, (term, fragment) => term.includes(fragment));
  }

  public termsEndingWith(suffix: string, corpus: string[]): string[] {
    return this.matchingTerms(suffix, corpus, (term, fragment) => term.endsWith(fragment));
  }

  public termsMatchingAll(fragments: string[], corpus: string[], matches: (term: string) => boolean): string[] {
    const narrowing = fragments.filter(fragment => fragment.length >= 3);
    const candidates = narrowing.length === 0 ? corpus : [...this.candidateTermsOfAll(narrowing)];
    return candidates.filter(matches);
  }

  public addTerm(term: string): void {
    for (const trigram of trigramsOf(term)) {
      let terms = this.termsByTrigram.get(trigram);

      if (terms === undefined) {
        terms = new Set<string>();
        this.termsByTrigram.set(trigram, terms);
      }
      terms.add(term);
    }
  }

  public removeTerm(term: string): void {
    for (const trigram of trigramsOf(term)) {
      const terms = this.termsByTrigram.get(trigram);

      if (terms === undefined) {
        continue;
      }
      terms.delete(term);

      if (terms.size === 0) {
        this.termsByTrigram.delete(trigram);
      }
    }
  }

  private matchingTerms(fragment: string, corpus: string[], matches: (term: string, fragment: string) => boolean): string[] {
    const candidates = fragment.length < 3 ? corpus : [...this.candidateTerms(fragment)];
    return candidates.filter(term => matches(term, fragment));
  }

  private candidateTermsOfAll(fragments: string[]): Set<string> {
    let candidates: Set<string> | null = null;

    for (const fragment of fragments) {
      const forFragment = this.candidateTerms(fragment);

      candidates = candidates === null ? forFragment : intersection(forFragment, candidates);

      if (candidates.size === 0) {
        return candidates;
      }
    }
    return candidates ?? new Set<string>();
  }

  private candidateTerms(substring: string): Set<string> {
    let candidates: Set<string> | null = null;

    for (const trigram of trigramsOf(substring)) {
      const terms = this.termsByTrigram.get(trigram);

      if (terms === undefined) {
        return new Set<string>();
      }
      candidates = candidates === null ? terms : intersection(terms, candidates);

      if (candidates.size === 0) {
        return candidates;
      }
    }
    return candidates ?? new Set<string>();
  }
}
