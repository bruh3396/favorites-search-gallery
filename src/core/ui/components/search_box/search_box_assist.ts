import { Occurrence } from "@/core/utils/reactive/occurrence";
import { TextEdit } from "@/core/ui/components/search_box/text_edit";

export interface SearchBoxAssist {
  readonly textEdits: Occurrence<TextEdit>;
  update(query: string, caret: number): void;
  close(): void;
  handleKey(event: KeyboardEvent): boolean;
}
