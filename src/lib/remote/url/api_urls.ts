import { LocalOverrides } from "@/config/local_overrides";

const PRODUCTION_SERVER_ORIGIN = "https://frozencobalt.stream";
const SERVER_ORIGIN = LocalOverrides.serverOrigin ?? PRODUCTION_SERVER_ORIGIN;

export const PING_URL = `${SERVER_ORIGIN}/ping`;
export const TAG_API_URL = `${SERVER_ORIGIN}/tag`;
export const POST_API_URL = `${SERVER_ORIGIN}/post`;
