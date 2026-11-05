import { Icon } from "@/core/ui/components/icon/icon";

export interface Suggestion {
  readonly text: string;
  readonly acceptedText?: string;
  readonly matchedLength?: number;
  readonly icon?: Icon;
  readonly detail?: string;
}
