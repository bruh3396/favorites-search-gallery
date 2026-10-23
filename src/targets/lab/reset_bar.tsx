import { h, render } from "@/core/ui/h/h";
import { ColorScheme } from "@/core/boundary/environment";
import { mountLabRoot } from "@/targets/lab/lab_root";
import { requestReset } from "@/targets/lab/lab_databases";

const ResetBarClass = {
  bar: "fsg-LabBar",
  button: "fsg-LabBar-button"
} as const;

export function mountResetBar(colorScheme: ColorScheme): void {
  const host = document.createElement("div");

  document.body.append(host);
  const root = mountLabRoot(host, colorScheme);

  root.classList.add(ResetBarClass.bar);
  root.append(render(document, () => (
    <button className={ResetBarClass.button} type="button" onClick={requestReset}>Reset lab</button>
  )).result);
}
