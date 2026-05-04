import { TooManyRequestsError } from "../../../types/errors";
import { sleep } from "../../core/scheduling/promise";

export async function fetchHtml(url: string, init?: RequestInit): Promise<string> {
  const response = await fetch429(url, init);

  if (!response.ok) {
    throw new Error(`Failed to fetch ${url}: ${response.statusText}`);
  }
  return response.text();
}

export function fetch429(input: string, init?: RequestInit | undefined): Promise<Response> {
  return fetch(input, init)
    .then((response) => {
      if (response.status === 429) {
        throw new TooManyRequestsError();
      }
      return response;
    });
}

export async function fetchBlob(url: string): Promise<Blob> {
  const response = await fetch429(url);

  if (!response.ok) {
    throw new Error(`Failed to fetch ${url}: ${response.statusText}`);
  }
  return response.blob();
}

export function fetch429NTimes(input: string, init: RequestInit | undefined, n: number): Promise<Response> {
  return fetch429(input, init).catch(async(error) => {
    if (error instanceof TooManyRequestsError && n > 1) {
      await sleep(2000);
      return fetch429NTimes(input, init, n - 1);
    }
    throw error;
  });
}
