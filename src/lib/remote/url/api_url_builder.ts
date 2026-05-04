import { LocalOverrides } from "../../../config/local_overrides";
import { USER_ID } from "../../environment/favorites_metadata";

const PRODUCTION_SERVER_ORIGIN = "https://favorites-search-gallery-api.onrender.com";
const PRIVATE_SERVER_ORIGIN = LocalOverrides.serverOrigin ?? PRODUCTION_SERVER_ORIGIN;
const LEGACY_TAG_BASE_URL = `${PRIVATE_SERVER_ORIGIN}/?userId=${USER_ID}&type=tag&name=`;

export const PING_URL = `${PRIVATE_SERVER_ORIGIN}/ping`;
export const TAG_API_URL = `${PRIVATE_SERVER_ORIGIN}/tag`;
export const buildLegacyTagURL = (tagName: string): string => `${LEGACY_TAG_BASE_URL}${encodeURIComponent(tagName)}`;
export const MULTI_POST_API_URL = `${PRIVATE_SERVER_ORIGIN}/multi-post`;
export const MULTI_POST_SLIM_API_URL = `${PRIVATE_SERVER_ORIGIN}/multi-post-slim`;
