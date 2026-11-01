import { buildSearchable } from "@/core/domain/search/testing/searchable_builder";

export const FRUIT_VOCABULARY = buildSearchable([
  "apple", "apricot", "banana", "blackberry", "blueberry",
  "cantaloupe", "cherry", "clementine", "coconut", "dragonfruit",
  "durian", "fig", "grape", "guava", "honeydew",
  "jackfruit", "kiwano", "kiwi", "lychee", "mango",
  "nectarine", "orange", "papaya", "passionfruit", "peach",
  "pear", "persimmon", "pineapple", "plum", "pomegranate",
  "raspberry", "starfruit", "strawberry", "tangerine", "watermelon"
].sort());
