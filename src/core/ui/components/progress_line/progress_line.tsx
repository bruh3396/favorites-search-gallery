import { Readable, computed, effect } from "@/core/utils/reactive/signal";
import { Progress } from "@/core/ui/components/progress_line/progress";
import { h } from "@/core/ui/h/h";

export const ProgressLineClass = {
  root: "fsg-ProgressLine",
  bar: "fsg-ProgressLine-bar"
} as const;

export interface ProgressLineProps {
  label: string;
  progress: Readable<Progress>;
}

export function ProgressLine({ label, progress }: ProgressLineProps): HTMLElement {
  const fraction = computed(() => (typeof progress.value === "number" ? Math.min(1, Math.max(0, progress.value)) : null));
  const root = (
    <div
      className={ProgressLineClass.root}
      role="progressbar"
      aria-label={label}
      aria-valuenow={computed(() => (fraction.value === null ? null : String(Math.round(fraction.value * 100))))}
      hidden={computed(() => progress.value === "idle")}
    >
      <div className={ProgressLineClass.bar} />
    </div>
  );

  effect(() => root.style.setProperty("--fsg-ProgressLine-fraction", String(fraction.value ?? 0)));
  return root;
}
