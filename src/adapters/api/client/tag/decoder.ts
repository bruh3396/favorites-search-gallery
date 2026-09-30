import { EncodedTagCategory } from "@/adapters/api/client/tag/tag";
import { TagCategory } from "@/core/domain/tag/tag";

const DECODINGS: Record<NonNullable<EncodedTagCategory>, TagCategory> = {
  0: "general",
  1: "artist",
  2: "unknown",
  3: "copyright",
  4: "character",
  5: "metadata"
};

export function decodeTagCategory(encoded: EncodedTagCategory): TagCategory {
  return encoded === null ? "general" : DECODINGS[encoded];
}
