import { Readable, computed } from "@/core/utils/reactive/signal";
import { h } from "@/core/ui/h/h";

export const EmptyStateClass = {
  root: "fsg-EmptyState",
  message: "fsg-EmptyState-message",
  action: "fsg-EmptyState-action"
} as const;

export interface EmptyStateAction {
  readonly label: string;
  readonly onClick: () => void;
}

export interface EmptyStateProps {
  isShown: Readable<boolean>;
  message: Readable<string>;
  action?: Readable<EmptyStateAction | null>;
}

export function EmptyState({ isShown, message, action }: EmptyStateProps): HTMLElement {
  return (
    <div className={EmptyStateClass.root} hidden={computed(() => !isShown.value)}>
      <p className={EmptyStateClass.message}>{message}</p>
      {action && (
        <button
          className={EmptyStateClass.action}
          type="button"
          hidden={computed(() => action.value === null)}
          onClick={() => action.peek()?.onClick()}
        >
          {computed(() => action.value?.label ?? "")}
        </button>
      )}
    </div>
  );
}
