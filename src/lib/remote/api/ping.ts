import { fetchApi } from "@/lib/remote/api/gateway";

export function setupServer(): void {
  fetchApi("ping");
}
