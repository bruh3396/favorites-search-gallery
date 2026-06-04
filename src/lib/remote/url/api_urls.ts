import { LocalOverrides } from "@/config/local_overrides";

const PRODUCTION_SERVER_ORIGIN = "https://favorites-search-gallery-api.bruh3396.workers.dev";
// const PRODUCTION_SERVER_ORIGIN = "http://localhost:8787";
const PRIVATE_SERVER_ORIGIN = LocalOverrides.serverOrigin ?? PRODUCTION_SERVER_ORIGIN;

export const PING_URL = `${PRIVATE_SERVER_ORIGIN}/ping`;
export const TAG_API_URL = `${PRIVATE_SERVER_ORIGIN}/tag`;
export const POST_API_URL = `${PRIVATE_SERVER_ORIGIN}/post`;
