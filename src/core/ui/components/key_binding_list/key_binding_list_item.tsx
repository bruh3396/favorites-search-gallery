import { Readable, Signal, computed, effect, untracked } from "@/core/utils/reactive/signal";
import { Scoped, captureScope } from "@/core/utils/reactive/scope";
import { IconButton } from "@/core/ui/components/icon_button/icon_button";
import { KeyCap } from "@/core/ui/components/key_cap/key_cap";
import { h } from "@/core/ui/h/h";
import { listHeldKeyPressModifiers } from "@/core/ui/key_bindings/key_press_modifier";
import { normalizeKeyPress } from "@/core/ui/key_bindings/key_press_normalizer";

export const KeyBindingListItemClass = {
  root: "fsg-KeyBindingListItem",
  label: "fsg-KeyBindingListItem-label",
  keys: "fsg-KeyBindingListItem-keys",
  unbound: "fsg-KeyBindingListItem-unbound",
  key: "fsg-KeyBindingListItem-key",
  captureGroup: "fsg-KeyBindingListItem-captureGroup",
  capture: "fsg-KeyBindingListItem-capture",
  remove: "fsg-KeyBindingListItem-remove",
  add: "fsg-KeyBindingListItem-add"
} as const;

export interface KeyBindingListItemProps {
  label: string;
  keys: Readable<readonly string[]>;
  maxKeyCount: number;
  formatKey: (key: string) => string;
  onKeyChange: (keyIndex: number, key: string) => void;
  onKeyRemove: (keyIndex: number) => void;
}

const MODIFIER_KEYS: ReadonlySet<string> = new Set(["Control", "Alt", "Meta", "Shift"]);
const RESERVED_COMMAND_KEYS = ["t", "w", "n", "r", "f", "l", "p", "s", "d", "h", "j", "q", "a", "c", "v", "x", "z", "Tab"];
const RESERVED_KEYS: ReadonlySet<string> = new Set([
  ...RESERVED_COMMAND_KEYS.flatMap(key => [`Ctrl+${key}`, `Meta+${key}`]),
  "Alt+ArrowLeft",
  "Alt+ArrowRight",
  "F5",
  "F11",
  "F12"
]);

export function KeyBindingListItem({ label, keys, maxKeyCount, formatKey, onKeyChange, onKeyRemove }: KeyBindingListItemProps): HTMLElement {
  const createKeysScope = captureScope();
  const capturedKeyIndex = new Signal<number | null>(null);
  const heldModifiersDescription = new Signal("");
  const refusedKey = new Signal<string | null>(null);
  const keysElement = <span className={KeyBindingListItemClass.keys} />;
  const unbound = <span className={KeyBindingListItemClass.unbound}>–</span>;
  let shown: Scoped<readonly HTMLElement[]> | null = null;
  let capture: HTMLElement | null = null;

  const endCapture = (): void => {
    heldModifiersDescription.value = "";
    refusedKey.value = null;
    capturedKeyIndex.value = null;
  };

  const describeCapture = (currentRefusedKey: string | null, currentHeldModifiersDescription: string): string => {
    if (currentRefusedKey !== null) {
      return `${formatKey(currentRefusedKey)} is used by the browser`;
    }
    return currentHeldModifiersDescription === "" ? "Press a key…" : `${currentHeldModifiersDescription}+…`;
  };

  const createCaptureGroup = (keyIndex: number): HTMLElement => {
    const isRemovable = keyIndex < keys.peek().length;

    capture = (
      <button
        className={KeyBindingListItemClass.capture}
        type="button"
        onKeydown={event => {
          if (event.key === "Tab") {
            return;
          }
          event.preventDefault();
          heldModifiersDescription.value = describeHeldModifiers(event);
          refusedKey.value = null;

          if (event.key === "Escape") {
            endCapture();
            return;
          }

          if (MODIFIER_KEYS.has(event.key)) {
            return;
          }
          const key = normalizeKeyPress(event);

          if (RESERVED_KEYS.has(key)) {
            refusedKey.value = key;
            return;
          }
          endCapture();
          onKeyChange(keyIndex, key);
        }}
        onKeyup={event => {
          heldModifiersDescription.value = describeHeldModifiers(event);
        }}
      >
        {computed(() => describeCapture(refusedKey.value, heldModifiersDescription.value))}
      </button>
    );
    const captureGroup: HTMLElement = (
      <span
        className={KeyBindingListItemClass.captureGroup}
        onFocusout={event => {
          if (!(event.relatedTarget instanceof Node && captureGroup.contains(event.relatedTarget))) {
            endCapture();
          }
        }}
      >
        {capture}
        {isRemovable && (
          <button
            className={KeyBindingListItemClass.remove}
            type="button"
            onPointerdown={event => event.preventDefault()}
            onClick={() => {
              endCapture();
              onKeyRemove(keyIndex);
            }}
          >
            Remove
          </button>
        )}
      </span>
    );
    return captureGroup;
  };

  const createKey = (key: string, keyIndex: number): HTMLElement => (
    <button
      className={KeyBindingListItemClass.key}
      type="button"
      aria-label={`Change ${formatKey(key)}`}
      onClick={() => {
        capturedKeyIndex.value = keyIndex;
      }}
    >
      <KeyCap label={formatKey(key)} />
    </button>
  );

  effect(() => {
    const currentKeys = keys.value;
    const currentCapturedKeyIndex = capturedKeyIndex.value;

    capture = null;
    shown?.dispose();
    shown = createKeysScope(() => untracked(() => [
      ...currentKeys.map((key, keyIndex) => (keyIndex === currentCapturedKeyIndex ? createCaptureGroup(keyIndex) : createKey(key, keyIndex))),
      ...currentCapturedKeyIndex === currentKeys.length ? [createCaptureGroup(currentKeys.length)] : []
    ]));
    keysElement.replaceChildren(...shown.result.length === 0 ? [unbound] : shown.result);
    (capture as HTMLElement | null)?.focus();
  });
  return (
    <div className={KeyBindingListItemClass.root}>
      <span className={KeyBindingListItemClass.label}>{label}</span>
      {keysElement}
      <span
        className={KeyBindingListItemClass.add}
        hidden={computed(() => capturedKeyIndex.value !== null || keys.value.length >= maxKeyCount)}
      >
        <IconButton
          icon="add"
          label="Add Key"
          size="small"
          onClick={() => {
            capturedKeyIndex.value = keys.peek().length;
          }}
        />
      </span>
    </div>
  );
}

function describeHeldModifiers(event: KeyboardEvent): string {
  return listHeldKeyPressModifiers(event).join("+");
}
