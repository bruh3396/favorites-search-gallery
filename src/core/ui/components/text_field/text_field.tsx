import { Readable, computed } from "@/core/utils/reactive/signal";
import { h } from "@/core/ui/h/h";

export const TextFieldClass = {
  root: "fsg-TextField",
  label: "fsg-TextField-label",
  input: "fsg-TextField-input",
  supportingText: "fsg-TextField-supportingText"
} as const;

export interface TextFieldProps {
  label: string;
  value: Readable<string>;
  supportingText?: Readable<string>;
  onValueChange: (value: string) => void;
}

export function TextField({ label, value, supportingText, onValueChange }: TextFieldProps): HTMLElement {
  return (
    <label className={TextFieldClass.root}>
      <span className={TextFieldClass.label}>{label}</span>
      <input
        className={TextFieldClass.input}
        type="text"
        spellcheck={false}
        value={value}
        onInput={event => onValueChange(event.currentTarget.value)}
      />
      {supportingText && (
        <span className={TextFieldClass.supportingText} hidden={computed(() => supportingText.value === "")}>
          {supportingText}
        </span>
      )}
    </label>
  );
}
