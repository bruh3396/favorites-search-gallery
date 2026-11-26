import { MetricSearchable } from "@/core/domain/search/metric_searchable";

type FruitName = "apple" | "banana" | "cherry" | "grape" | "kiwi" | "mango" | "blueberry" | "orange" | "pear" | "strawberry" | "pineapple";
export type Fruit = MetricSearchable & { name: FruitName };
