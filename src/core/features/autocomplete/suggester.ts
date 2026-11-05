import { Suggestion } from "@/core/ui/components/suggestion_list/suggestion";

export interface Suggester {
  suggest(prefix: string): readonly Suggestion[];
}
