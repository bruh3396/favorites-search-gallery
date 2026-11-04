import { Confirmer } from "@/core/boundary/ports/confirmer/confirmer";

export class MemoryConfirmer implements Confirmer {
  public readonly questions: string[] = [];

  constructor(public answer = true) { }

  public confirm(question: string): boolean {
    this.questions.push(question);
    return this.answer;
  }
}
