import { Readable, computed } from "@/core/utils/reactive/signal";
import { Button } from "@/core/ui/components/button/button";
import { h } from "@/core/ui/h/h";

export const EmptyStateClass = {
  root: "fsg-EmptyState",
  message: "fsg-EmptyState-message"
} as const;

interface EmptyStateAction {
  readonly label: string;
  onClick: () => void;
}

export interface EmptyStateProps {
  message: Readable<string>;
  action?: Readable<EmptyStateAction | null>;
}

export function EmptyState({ message, action }: EmptyStateProps): HTMLElement {
  return (
    <div className={EmptyStateClass.root}>
      <p className={EmptyStateClass.message}>{message}</p>
      {action && (
        <div hidden={computed(() => action.value === null)}>
          <Button label={computed(() => action.value?.label ?? "")} onClick={() => action.peek()?.onClick()} />
        </div>
      )}
    </div>
  );
}
