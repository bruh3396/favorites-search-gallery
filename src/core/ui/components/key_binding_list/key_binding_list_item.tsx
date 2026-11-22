import { Readable, effect, untracked } from "@/core/utils/reactive/signal";
import { Scoped, captureScope } from "@/core/utils/reactive/scope";
import { KeyCap } from "@/core/ui/components/key_cap/key_cap";
import { h } from "@/core/ui/h/h";

export const KeyBindingListItemClass = {
  root: "fsg-KeyBindingListItem",
  label: "fsg-KeyBindingListItem-label",
  keys: "fsg-KeyBindingListItem-keys",
  unbound: "fsg-KeyBindingListItem-unbound"
} as const;

export interface KeyBindingListItemProps {
  label: string;
  keys: Readable<readonly string[]>;
  formatKey: (key: string) => string;
}

export function KeyBindingListItem({ label, keys, formatKey }: KeyBindingListItemProps): HTMLElement {
  const createKeysScope = captureScope();
  const keysElement = <span className={KeyBindingListItemClass.keys} />;
  const unbound = <span className={KeyBindingListItemClass.unbound}>–</span>;
  let shown: Scoped<readonly HTMLElement[]> | null = null;

  effect(() => {
    const currentKeys = keys.value;

    shown?.dispose();
    shown = createKeysScope(() => untracked(() => currentKeys.map(key => <KeyCap label={formatKey(key)} />)));
    keysElement.replaceChildren(...currentKeys.length === 0 ? [unbound] : shown.result);
  });
  return (
    <div className={KeyBindingListItemClass.root}>
      <span className={KeyBindingListItemClass.label}>{label}</span>
      {keysElement}
    </div>
  );
}
