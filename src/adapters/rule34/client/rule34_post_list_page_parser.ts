import { MediaMinter } from "@/core/domain/media/media_minter";
import { Rule34PostListPage } from "@/adapters/rule34/client/rule34_post_list_page";
import { parseRule34Thumb } from "@/adapters/rule34/client/rule34_thumb_parser";

export function parseRule34PostListPage(page: ParentNode, mintMedia: MediaMinter): Rule34PostListPage {
  return {
    posts: [...page.querySelectorAll<HTMLElement>(".thumb")].map(thumb => parseRule34Thumb(thumb, mintMedia)).filter(post => post !== null),
    paginator: page.querySelector<HTMLElement>("#paginator")
  };
}
