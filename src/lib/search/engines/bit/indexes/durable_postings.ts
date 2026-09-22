import { DensePosting, Posting, SparsePosting } from "@/lib/search/engines/bit/postings/posting";
import { BitSet } from "@/lib/search/engines/bit/postings/bitset";
import { PackedPostings } from "@/lib/search/engines/bit/postings/packed_postings";

export class DurablePostings {
  private densePostings = new Map<string, DensePosting>();
  private readonly sparsePostings = new PackedPostings();

  public materializeFrom(entries: Iterable<[string, number[]]>, capacity: number): void {
    const threshold = Math.ceil(capacity / 32);
    const sparse: [string, number[]][] = [];
    let sparsePositions = 0;
    let maxPosition = 0;

    this.densePostings = new Map<string, DensePosting>();

    for (const [term, positions] of entries) {
      if (positions.length > threshold) {
        this.densePostings.set(term, new DensePosting(bitsetOf(positions, capacity)));
      } else {
        sparse.push([term, positions]);
        sparsePositions += positions.length;
        maxPosition = Math.max(maxPosition, positions[positions.length - 1] ?? 0);
      }
    }
    this.sparsePostings.pack(sparse, sparsePositions, maxPosition);
  }

  public terms(): string[] {
    return [...this.densePostings.keys(), ...this.sparsePostings.terms()];
  }

  public postingFor(term: string): Posting | undefined {
    const dense = this.densePostings.get(term);

    if (dense !== undefined) {
      return dense;
    }
    const sparse = this.sparsePostings.positionsFor(term);
    return sparse === undefined ? undefined : new SparsePosting(sparse);
  }

  public forEachPosting(visit: (term: string, positions: number[]) => void): void {
    for (const [term, posting] of this.densePostings) {
      visit(term, posting.positions());
    }

    for (const term of this.sparsePostings.terms()) {
      const positions = this.sparsePostings.positionsFor(term);

      if (positions !== undefined) {
        visit(term, Array.from(positions));
      }
    }
  }
}

function bitsetOf(positions: number[], capacity: number): BitSet {
  const bits = new BitSet(capacity);

  for (const position of positions) {
    bits.set(position);
  }
  return bits;
}
