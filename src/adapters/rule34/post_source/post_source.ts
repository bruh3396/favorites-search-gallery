import { ParsedPost, PostSource } from "@/core/boundary/ports";
import { fetchPostPage } from "@/adapters/rule34/client/post_page/post_page";

export class Rule34PostSource implements PostSource {
  public fetch(id: string): Promise<ParsedPost> {
    return fetchPostPage(id);
  }
}
