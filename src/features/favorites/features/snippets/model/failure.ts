import { SnippetFailureReason } from "@/features/favorites/features/snippets/types/types";

export function describe(reason: SnippetFailureReason, name: string): string {
  switch (reason) {
    case "empty-name":
      return "A snippet needs a name";

    case "empty-query":
      return "A snippet needs a query";

    case "duplicate-name":
      return `A snippet named /${name} already exists`;

    default:
      return "That snippet no longer exists";
  }
}
