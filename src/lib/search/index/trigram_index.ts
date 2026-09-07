import { intersection } from "@/utils/pure/set";
import { trigramsOf } from "@/utils/pure/string";

export class TrigramIndex {
  private readonly termsByTrigram: Map<string, Set<string>> = new Map<string, Set<string>>();

  constructor(terms: string[]) {
    for (const term of terms) {
      this.addTerm(term);
    }
  }

  public termsMatching(fragment: string, corpus: string[]): string[] {
    return fragment.length < 3 ? corpus : [...this.candidateTerms(fragment)];
  }

  public termsMatchingAll(fragments: string[], corpus: string[]): string[] {
    const narrowing = fragments.filter(fragment => fragment.length >= 3);
    return narrowing.length === 0 ? corpus : [...this.candidateTermsOfAll(narrowing)];
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
}
