interface SnippetHandlerMap {
  onUse: (name: string) => void;
  onEdit: (name: string) => void;
  onDelete: (name: string) => void;
  onDeleteRequested: (name: string) => void;
  onDeleteCancelled: () => void;
  onSave: () => void;
  onEditCancelled: () => void;
  onEditorInput: () => void;
  onFiltered: () => void;
}

export const SnippetHandlers: SnippetHandlerMap = {
  onUse: () => { },
  onEdit: () => { },
  onDelete: () => { },
  onDeleteRequested: () => { },
  onDeleteCancelled: () => { },
  onSave: () => { },
  onEditCancelled: () => { },
  onEditorInput: () => { },
  onFiltered: () => { }
};

export function setHandlers(handlers: SnippetHandlerMap): void {
  Object.assign(SnippetHandlers, handlers);
}
