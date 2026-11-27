import { Child, h } from "@/core/ui/h/h";

export const LabRowClass = {
  root: "fsg-LabRow",
  name: "fsg-LabRow-name",
  controls: "fsg-LabRow-controls",
  actions: "fsg-LabRow-actions",
  progress: "fsg-LabRow-progress"
} as const;

export interface LabRowProps {
  name: string;
  controlsChild?: Child;
  actionsChild: Child;
  progressChild?: Child;
}

export function LabRow({ name, controlsChild, actionsChild, progressChild }: LabRowProps): HTMLElement {
  const nameElement = <span className={LabRowClass.name}>{name}</span>;
  const element = (
    <div className={LabRowClass.root} role="group">
      {nameElement}
      <div className={LabRowClass.controls}>{controlsChild}</div>
      <div className={LabRowClass.actions}>{actionsChild}</div>
      {progressChild !== undefined && <div className={LabRowClass.progress}>{progressChild}</div>}
    </div>
  );

  element.ariaLabelledByElements = [nameElement];
  return element;
}
