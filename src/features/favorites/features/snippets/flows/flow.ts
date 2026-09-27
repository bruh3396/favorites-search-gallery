import { SnippetContext } from "@/features/favorites/features/snippets/types/types";
import { SnippetFlows } from "@/features/favorites/features/snippets/flows/flows";
import { SnippetModel } from "@/features/favorites/features/snippets/model/model";
import { SnippetView } from "@/features/favorites/features/snippets/view/view";

export interface SnippetFlowDependencies {
  context: SnippetContext;
  model: SnippetModel;
  view: SnippetView;
  flows: SnippetFlows;
}

export abstract class SnippetFlow {
  protected readonly context: SnippetContext;
  protected readonly model: SnippetModel;
  protected readonly view: SnippetView;
  protected readonly flows: SnippetFlows;

  constructor(dependencies: SnippetFlowDependencies) {
    this.context = dependencies.context;
    this.model = dependencies.model;
    this.view = dependencies.view;
    this.flows = dependencies.flows;
  }
}
