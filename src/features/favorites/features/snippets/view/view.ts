import * as SnippetComponents from "@/features/favorites/features/snippets/view/components";
import { Snippet, SnippetScene } from "@/features/favorites/features/snippets/types/types";
import { SnippetEditor } from "@/features/favorites/features/snippets/view/editor";
import { SnippetShell } from "@/features/favorites/features/snippets/shell/shell";

export class SnippetView {
  private readonly shell: SnippetShell;
  private readonly editor: SnippetEditor;

  constructor(shell: SnippetShell) {
    this.shell = shell;
    this.editor = new SnippetEditor(shell);
  }

  public mount(container: HTMLElement): void {
    container.classList.add("favorites-snippets-section");
    container.append(this.shell.filter, this.shell.list, this.shell.footer);
  }

  public render(scene: SnippetScene): void {
    this.shell.list.replaceChildren(...SnippetComponents.list(scene));
    this.editor.render(scene);
  }

  public fill(snippet: Snippet): void {
    this.editor.fill(snippet);
  }

  public clear(): void {
    this.editor.clear();
  }

  public setQuery(query: string): void {
    this.editor.setQuery(query);
  }
}
