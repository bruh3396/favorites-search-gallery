declare const USE_LOCAL_SERVER: boolean;

export const LocalOverrides = {
  serverOrigin: USE_LOCAL_SERVER ? "http://localhost:3001" : null
};
