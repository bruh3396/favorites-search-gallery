import { Chip } from "@/core/ui/components/chip/chip";
import { h } from "@/core/ui/h/h";

export const KeyBindingListItemNoticeClass = {
  root: "fsg-KeyBindingListItemNotice",
  actions: "fsg-KeyBindingListItemNotice-actions"
} as const;

export interface KeyBindingListItemNoticeAction {
  readonly label: string;
  onClick: () => void;
}

export interface KeyBindingListItemNoticeProps {
  message: string;
  actions: readonly KeyBindingListItemNoticeAction[];
}

export function KeyBindingListItemNotice({ message, actions: keyBindingListItemNoticeActions }: KeyBindingListItemNoticeProps): HTMLElement {
  return (
    <div className={KeyBindingListItemNoticeClass.root}>
      {message}
      <span className={KeyBindingListItemNoticeClass.actions}>
        {keyBindingListItemNoticeActions.map(({ label, onClick }) => <Chip label={label} onClick={onClick} />)}
      </span>
    </div>
  );
}
