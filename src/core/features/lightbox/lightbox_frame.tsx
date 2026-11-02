import { Child, h } from "@/core/ui/h/h";

export const LightboxFrameClass = {
  root: "fsg-LightboxFrame"
} as const;

export interface LightboxFrameProps {
  contentChild: Child;
}

export function LightboxFrame(props: LightboxFrameProps): HTMLDivElement {
  return <div className={LightboxFrameClass.root}>{props.contentChild}</div> as HTMLDivElement;
}
