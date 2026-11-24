import { createIcon } from "@/core/ui/components/icon/icon";
import { h } from "@/core/ui/h/h";

export const AppMarkClass = {
  root: "fsg-AppMark",
  logo: "fsg-AppMark-logo",
  version: "fsg-AppMark-version"
} as const;

export interface AppMarkProps {
  scriptVersion: string;
}

export function AppMark({ scriptVersion }: AppMarkProps): HTMLElement {
  return (
    <div className={AppMarkClass.root} role="img" aria-label={`Favorites Search Gallery ${scriptVersion}`} title={`Favorites Search Gallery ${scriptVersion}`}>
      {createIcon("logo", AppMarkClass.logo)}
      <span className={AppMarkClass.version}>{scriptVersion.split("-")[0]}</span>
    </div>
  );
}
