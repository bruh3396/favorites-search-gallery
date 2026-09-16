import { AppContext } from "@/app/context/context";
import { GalleryControl } from "@/features/gallery/control/control";
import { GalleryFeatures } from "@/features/gallery/features/features";
import { GalleryFlows } from "@/features/gallery/flows/flows";
import { GalleryMenuAction } from "@/types/app";
import { GalleryModel } from "@/features/gallery/model/model";
import { GalleryView } from "@/features/gallery/view/view";

export interface Renderer {
  root: HTMLElement;
  render: (thumb: HTMLElement) => void;
  hide: () => void;
  cache: (thumbs: HTMLElement[]) => Promise<void> | void;
}

export type VideoClip = {
  start: number;
  end: number;
};

export interface GalleryViewDependencies {
  onMenuAction: (action: GalleryMenuAction) => void;
  onVideoEnded: () => void;
  onVideoDoubleClicked: (event: MouseEvent) => void;
  onVolumeChanged: (volume: number) => void;
}

export type GalleryMenuButton = {
  id: string;
  icon: string;
  action: GalleryMenuAction;
  enabled: boolean;
  tooltip: string;
  color: string;
  href?: string;
};

export interface GalleryComponents {
  context: AppContext;
  model: GalleryModel;
  view: GalleryView;
  control: GalleryControl;
  flows: GalleryFlows;
  features: GalleryFeatures;
}
