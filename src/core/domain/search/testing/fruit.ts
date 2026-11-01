import { MetricSearchable } from "@/core/domain/search/searchable";

export type FruitName = "apple" | "banana" | "cherry" | "grape" | "kiwi" | "mango" | "blueberry" | "orange" | "pear" | "strawberry" | "pineapple";
export type Fruit = MetricSearchable & { name: FruitName };
