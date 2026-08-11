interface SnippetHandlerMap {
  onUse: (name: string) => void;
  onCopy: (name: string) => void;
  onEdit: (name: string) => void;
  onDelete: (name: string) => void;
  onDeleteRequested: (name: string) => void;
  onDeleteCancelled: () => void;
  onSave: () => void;
  onResultsQueryRequested: () => void;
  onEditCancelled: () => void;
  onEditorInput: () => void;
  onFiltered: () => void;
}

export const SnippetHandlers: SnippetHandlerMap = {
  onUse: () => { },
  onCopy: () => { },
  onEdit: () => { },
  onDelete: () => { },
  onDeleteRequested: () => { },
  onDeleteCancelled: () => { },
  onSave: () => { },
  onResultsQueryRequested: () => { },
  onEditCancelled: () => { },
  onEditorInput: () => { },
  onFiltered: () => { }
};

export function setHandlers(handlers: SnippetHandlerMap): void {
  Object.assign(SnippetHandlers, handlers);
}
