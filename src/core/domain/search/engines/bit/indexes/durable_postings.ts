import { DensePosting, Posting, SparsePosting } from "@/core/domain/search/engines/bit/posting/posting";
import { BitSet } from "@/core/domain/search/engines/bit/posting/bitset";
import { PackedPostings } from "@/core/domain/search/engines/bit/indexes/packed_postings";

export class DurablePostings {
  private densePostings = new Map<string, DensePosting>();
  private readonly sparsePackedPostings = new PackedPostings();

  public materializeFrom(entries: Iterable<[string, number[]]>, capacity: number): void {
    const threshold = Math.ceil(capacity / 32);
    const sparse: [string, number[]][] = [];
    let sparsePositions = 0;
    let maxPosition = 0;

    this.densePostings = new Map<string, DensePosting>();

    for (const [term, positions] of entries) {
      if (positions.length > threshold) {
        this.densePostings.set(term, new DensePosting(createBitset(positions, capacity)));
      } else {
        sparse.push([term, positions]);
        sparsePositions += positions.length;
        maxPosition = Math.max(maxPosition, positions[positions.length - 1]);
      }
    }
    this.sparsePackedPostings.pack(sparse, sparsePositions, maxPosition);
  }

  public terms(): string[] {
    return [...this.densePostings.keys(), ...this.sparsePackedPostings.terms()];
  }

  public findPosting(term: string): Posting | undefined {
    const densePosting = this.densePostings.get(term);

    if (densePosting !== undefined) {
      return densePosting;
    }
    const sparse = this.sparsePackedPostings.findPositions(term);
    return sparse === undefined ? undefined : new SparsePosting(sparse);
  }

  public forEachPosting(visit: (term: string, positions: number[]) => void): void {
    for (const [term, densePosting] of this.densePostings) {
      visit(term, densePosting.positions());
    }
    this.sparsePackedPostings.forEachTerm((term, positionArray) => visit(term, [...positionArray]));
  }
}

function createBitset(positions: number[], capacity: number): BitSet {
  const bitSet = new BitSet(capacity);

  for (const position of positions) {
    bitSet.set(position);
  }
  return bitSet;
}
