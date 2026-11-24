import { Readable, Signal, computed, effect, untracked } from "@/core/utils/reactive/signal";
import { Scoped, captureScope } from "@/core/utils/reactive/scope";
import { Chip } from "@/core/ui/components/chip/chip";
import { IconButton } from "@/core/ui/components/icon_button/icon_button";
import { KeyBindingListItemNotice } from "@/core/ui/components/key_binding_list/key_binding_list_item_notice";
import { KeyCap } from "@/core/ui/components/key_cap/key_cap";
import { ListRow } from "@/core/ui/components/list_row/list_row";
import { h } from "@/core/ui/h/h";
import { listHeldKeyPressModifiers } from "@/core/ui/key_bindings/key_press_modifier";
import { normalizeKeyPress } from "@/core/ui/key_bindings/key_press_normalizer";

export const KeyBindingListItemClass = {
  root: "fsg-KeyBindingListItem",
  label: "fsg-KeyBindingListItem-label",
  keys: "fsg-KeyBindingListItem-keys",
  key: "fsg-KeyBindingListItem-key",
  captureGroup: "fsg-KeyBindingListItem-captureGroup",
  capture: "fsg-KeyBindingListItem-capture",
  captureActions: "fsg-KeyBindingListItem-captureActions",
  add: "fsg-KeyBindingListItem-add",
  notSet: "fsg-KeyBindingListItem-notSet",
  notice: "fsg-KeyBindingListItem-notice"
} as const;

export interface KeyBindingListItemProps {
  label: string;
  keys: Readable<readonly string[]>;
  maxKeyCount: number;
  formatKey: (key: string) => string;
  findKeyOwnerLabel: (key: string) => string | undefined;
  onKeyChange: (keyIndex: number, key: string) => void;
  onKeyRemove: (keyIndex: number) => void;
}

interface KeyConflict {
  readonly keyIndex: number;
  readonly key: string;
  readonly keyOwnerLabel: string;
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

export function KeyBindingListItem({
  label, keys, maxKeyCount, formatKey, findKeyOwnerLabel, onKeyChange, onKeyRemove
}: KeyBindingListItemProps): HTMLElement {
  const createKeysScope = captureScope();
  const createNoticeScope = captureScope();
  const capturedKeyIndex = new Signal<number | null>(null);
  const heldModifiersDescription = new Signal("");
  const refusedKey = new Signal<string | null>(null);
  const keyConflict = new Signal<KeyConflict | null>(null);
  const keysElement = <span className={KeyBindingListItemClass.keys} />;
  const noticeSlot = <div className={KeyBindingListItemClass.notice} />;
  let shown: Scoped<readonly HTMLElement[]> | null = null;
  let shownNotice: Scoped<HTMLElement | null> | null = null;
  let capture: HTMLElement | null = null;

  const endCapture = (): void => {
    heldModifiersDescription.value = "";
    refusedKey.value = null;
    keyConflict.value = null;
    capturedKeyIndex.value = null;
  };

  const describeCapture = (): string => {
    const currentRefusedKey = refusedKey.value;
    const currentKeyConflict = keyConflict.value;

    if (currentRefusedKey !== null) {
      return formatKey(currentRefusedKey);
    }

    if (currentKeyConflict !== null) {
      return formatKey(currentKeyConflict.key);
    }
    return heldModifiersDescription.value === "" ? "Press a key…" : `${heldModifiersDescription.value}+…`;
  };

  const createNotice = (currentRefusedKey: string | null, currentKeyConflict: KeyConflict | null): HTMLElement | null => {
    if (currentRefusedKey !== null) {
      return <KeyBindingListItemNotice message={`${formatKey(currentRefusedKey)} is used by the browser`} actions={[]} />;
    }

    if (currentKeyConflict === null) {
      return null;
    }
    return (
      <KeyBindingListItemNotice
        message={`${formatKey(currentKeyConflict.key)} is used by ${currentKeyConflict.keyOwnerLabel}`}
        actions={[
          {
            label: "Overwrite",
            onClick: (): void => {
              endCapture();
              onKeyChange(currentKeyConflict.keyIndex, currentKeyConflict.key);
            }
          },
          { label: "Cancel", onClick: endCapture }
        ]}
      />
    );
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
          keyConflict.value = null;

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
          const keyOwnerLabel = findKeyOwnerLabel(key);

          if (keyOwnerLabel !== undefined) {
            keyConflict.value = { keyIndex, key, keyOwnerLabel };
            return;
          }
          endCapture();
          onKeyChange(keyIndex, key);
        }}
        onKeyup={event => {
          heldModifiersDescription.value = describeHeldModifiers(event);
        }}
      >
        {computed(describeCapture)}
      </button>
    );
    const removeActions = isRemovable ? [
      <Chip
        label="Remove"
        onClick={() => {
          endCapture();
          onKeyRemove(keyIndex);
        }}
      />
    ] : [];
    const captureActions = <span className={KeyBindingListItemClass.captureActions} />;

    effect(() => {
      captureActions.replaceChildren(...keyConflict.value === null ? removeActions : []);
    });
    return (
      <span className={KeyBindingListItemClass.captureGroup}>
        {capture}
        {captureActions}
      </span>
    );
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

  const startAddingKey = (): void => {
    capturedKeyIndex.value = keys.peek().length;
  };
  const addButton = <IconButton icon="add" label="Add Key" onClick={startAddingKey} />;
  const notSetButton = (
    <button className={KeyBindingListItemClass.notSet} type="button" onClick={startAddingKey}>
      Not set
    </button>
  );
  const addSlot = (
    <span className={KeyBindingListItemClass.add}>
      {notSetButton}
      {addButton}
    </span>
  );

  effect(() => {
    const currentKeys = keys.value;
    const currentCapturedKeyIndex = capturedKeyIndex.value;
    const focusedKeyIndex = shown?.result.findIndex(element => element.contains((element.getRootNode() as Document | ShadowRoot).activeElement)) ?? -1;
    const replacedElements = [...keysElement.children];

    capture = null;
    shown?.dispose();
    shown = createKeysScope(() => untracked(() => [
      ...currentKeys.map((key, keyIndex) => (keyIndex === currentCapturedKeyIndex ? createCaptureGroup(keyIndex) : createKey(key, keyIndex))),
      ...currentCapturedKeyIndex === currentKeys.length ? [createCaptureGroup(currentKeys.length)] : []
    ]));
    keysElement.append(...shown.result);
    addSlot.hidden = currentCapturedKeyIndex !== null || currentKeys.length >= maxKeyCount;
    notSetButton.hidden = currentKeys.length !== 0;
    addButton.hidden = currentKeys.length === 0;

    if (capture !== null) {
      (capture as HTMLElement).focus();
    } else if (focusedKeyIndex !== -1) {
      (shown.result.at(focusedKeyIndex) ?? (addSlot.hidden ? shown.result.at(-1) : (currentKeys.length === 0 ? notSetButton : addButton)))?.focus();
    }

    for (const replacedElement of replacedElements) {
      replacedElement.remove();
    }
  });
  effect(() => {
    const currentRefusedKey = refusedKey.value;
    const currentKeyConflict = keyConflict.value;

    shownNotice?.dispose();
    shownNotice = createNoticeScope(() => untracked(() => createNotice(currentRefusedKey, currentKeyConflict)));
    noticeSlot.hidden = shownNotice.result === null;
    noticeSlot.replaceChildren(...shownNotice.result === null ? [] : [shownNotice.result]);
  });
  const root: HTMLElement = (
    <ListRow
      className={KeyBindingListItemClass.root}
      onMousedown={event => {
        if (capturedKeyIndex.peek() !== null) {
          event.preventDefault();
        }
      }}
      onClick={event => {
        if (!addSlot.hidden && !isOnButton(event)) {
          capturedKeyIndex.value = keys.peek().length;
        }
      }}
      onFocusout={event => {
        if (!(event.relatedTarget instanceof Node && root.contains(event.relatedTarget))) {
          endCapture();
        }
      }}
    >
      <span className={KeyBindingListItemClass.label} title={label}>{label}</span>
      {addSlot}
      {keysElement}
      {noticeSlot}
    </ListRow>
  );
  return root;
}

function isOnButton(event: MouseEvent): boolean {
  return event.composedPath().some(target => target instanceof HTMLButtonElement);
}

function describeHeldModifiers(event: KeyboardEvent): string {
  return listHeldKeyPressModifiers(event).join("+");
}
