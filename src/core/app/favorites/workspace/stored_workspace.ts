import { Codec, createListCodec, createRecordCodec } from "@/core/utils/codec/codec";
import { DEFAULT_SEARCH_SETTINGS, SEARCH_SETTINGS_GUARDS, SearchSettings } from "@/core/features/favorites/search/inputs";
import { Readable, effect } from "@/core/utils/reactive/signal";
import { LocalKeyedValues } from "@/core/boundary/ports/local_keyed_values/local_keyed_values";
import { NamespacedLocalKeyedValues } from "@/core/boundary/ports/local_keyed_values/namespaced_local_keyed_values";
import { isRecord } from "@/core/utils/guards/guards";

export interface Workspace {
  readonly panes: readonly { readonly tabs: readonly SearchSettings[]; readonly activeIndex: number }[];
}

type Pane = Workspace["panes"][number];

const WORKSPACE_NAMESPACE = "favoritesWorkspace";
const DEFAULT_WORKSPACE: Workspace = { panes: [{ tabs: [DEFAULT_SEARCH_SETTINGS], activeIndex: 0 }] };
const TABS_CODEC = createListCodec(createRecordCodec(DEFAULT_SEARCH_SETTINGS, SEARCH_SETTINGS_GUARDS));
const PANES_CODEC = createListCodec<Pane>({
  decode: (stored): Pane | undefined => {
    if (!isRecord(stored)) {
      return undefined;
    }
    const tabs = TABS_CODEC.decode(stored.tabs);
    return tabs !== undefined && tabs.length > 0 ? { tabs, activeIndex: decodeActiveIndex(stored.activeIndex, tabs.length) } : undefined;
  },
  encode: (pane): unknown => ({ tabs: TABS_CODEC.encode(pane.tabs), activeIndex: pane.activeIndex })
});
const WORKSPACE_CODEC: Codec<Workspace> = {
  decode: (stored): Workspace | undefined => {
    const panes = isRecord(stored) ? PANES_CODEC.decode(stored.panes) : undefined;
    return panes !== undefined && panes.length > 0 ? { panes } : undefined;
  },
  encode: (workspace): unknown => ({ panes: PANES_CODEC.encode(workspace.panes) })
};

export function restoreWorkspace(storage: LocalKeyedValues, favoritesOwnerId: string): Workspace {
  const stored = new NamespacedLocalKeyedValues(WORKSPACE_NAMESPACE, storage).get(favoritesOwnerId);
  return WORKSPACE_CODEC.decode(stored) ?? DEFAULT_WORKSPACE;
}

export function persistWorkspace(storage: LocalKeyedValues, favoritesOwnerId: string, workspace: Readable<Workspace>): () => void {
  const workspaces = new NamespacedLocalKeyedValues(WORKSPACE_NAMESPACE, storage);
  return effect(() => workspaces.set(favoritesOwnerId, WORKSPACE_CODEC.encode(workspace.value)));
}

function decodeActiveIndex(stored: unknown, tabCount: number): number {
  return typeof stored === "number" && Number.isInteger(stored) && stored >= 0 && stored < tabCount ? stored : 0;
}
