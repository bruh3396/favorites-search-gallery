import { SnippetContext } from "@/features/favorites/features/snippets/types/types";
import { SnippetFlowDependencies } from "@/features/favorites/features/snippets/flows/flow";
import { SnippetLibraryFlow } from "@/features/favorites/features/snippets/flows/library";
import { SnippetModel } from "@/features/favorites/features/snippets/model/model";
import { SnippetView } from "@/features/favorites/features/snippets/view/view";

export class SnippetFlows {
  public readonly library: SnippetLibraryFlow;

  constructor(context: SnippetContext, model: SnippetModel, view: SnippetView) {
    const dependencies: SnippetFlowDependencies = { context, model, view, flows: this };

    this.library = new SnippetLibraryFlow(dependencies);
  }
}
