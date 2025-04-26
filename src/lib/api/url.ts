const API_BASE_URL = "https://api.rule34.xxx//index.php?page=dapi&s=";
const POST_PAGE_URL = "https://rule34.xxx/index.php?page=post&s=view&id=";
const POST_VOTE_URL = "https://rule34.xxx/index.php?page=post&s=vote&type=up&id=";
const ADD_FAVORITE_URL = "https://rule34.xxx/public/addfav.php?id=";
const DELETE_FAVORITE_URL = "https://rule34.xxx/index.php?page=favorites&s=delete&id=";

function createAPIURL(type: string, id: string): string {
  return `${API_BASE_URL}${type}&q=index&id=${id}`;
}

function createPostPageURL(id: string): string {
  return `${POST_PAGE_URL}${id}`;
}

function createVoteURL(id: string): string {
  return `${POST_VOTE_URL}${id}`;
}

function createAddFavoriteURL(id: string): string {
  return `${ADD_FAVORITE_URL}${id}`;
}

function createDeleteFavoriteURL(id: string): string {
  return `${DELETE_FAVORITE_URL}${id}`;
}

const URL = {
  createAPIURL,
  createPostPageURL,
  createVoteURL,
  createAddFavoriteURL,
  createRemoveFavoriteURL: createDeleteFavoriteURL
};

export default URL;
