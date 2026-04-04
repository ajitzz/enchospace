import { ApiError } from "./types";

const MAX_RETRIES = 3;
const TIMEOUT_MS = 5000;

async function fetchWithTimeout(resource: string, options: RequestInit = {}) {
  const { timeout = TIMEOUT_MS } = options as any;
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  const response = await fetch(resource, {
    ...options,
    signal: controller.signal,
  });
  clearTimeout(id);
  return response;
}

export async function fetchApi<T>(
  url: string,
  options: RequestInit = {},
  retryCount = 0
): Promise<T> {
  try {
    const response = await fetchWithTimeout(url, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
    });

    if (!response.ok) {
      const errorData: ApiError = await response.json().catch(() => ({
        error: "An unexpected error occurred",
        code: "UNKNOWN_ERROR",
        timestamp: new Date().toISOString(),
      }));
      throw new Error(errorData.error || "API Request Failed");
    }

    const data = await response.json();
    return data as T;
  } catch (error: any) {
    if (error.name === "AbortError") {
      throw new Error("Request timed out");
    }
    if (retryCount < MAX_RETRIES) {
      const delay = Math.pow(2, retryCount) * 1000;
      await new Promise((resolve) => setTimeout(resolve, delay));
      return fetchApi<T>(url, options, retryCount + 1);
    }
    throw error;
  }
}
