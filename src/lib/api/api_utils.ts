import { TooManyRequestsError } from "../../types/error_types";

export async function getHTML(url: string): Promise<string> {
  const response = await fetch429(url);

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

export function fetch429NTimes(input: string, init: RequestInit | undefined, n: number): Promise<Response> {
  return fetch429(input, init).catch((error) => {
    if (error instanceof TooManyRequestsError && n > 1) {
      return fetch429NTimes(input, init, n - 1);
    }
    throw error;
  });
}
