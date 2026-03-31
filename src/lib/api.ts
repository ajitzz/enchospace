const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '');

function toApiUrl(path: string): string {
  if (!path.startsWith('/')) {
    throw new Error(`API path must start with '/': ${path}`);
  }

  return `${API_BASE_URL}${path}`;
}

export async function fetchJson<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(toApiUrl(path), init);
  const contentType = response.headers.get('content-type') || '';

  if (!response.ok) {
    let details = `${response.status} ${response.statusText}`;

    if (contentType.includes('application/json')) {
      try {
        const errorBody = await response.json();
        details = typeof errorBody?.error === 'string' ? errorBody.error : details;
      } catch {
        // No-op: fallback to status details
      }
    }

    throw new Error(`Request to ${path} failed: ${details}`);
  }

  if (!contentType.includes('application/json')) {
    const preview = (await response.text()).slice(0, 80).replace(/\s+/g, ' ');
    throw new Error(
      `Request to ${path} returned non-JSON content (${contentType || 'unknown'}). ` +
      `Preview: ${preview}. This usually means the API route is misconfigured and returned index.html.`
    );
  }

  return response.json() as Promise<T>;
}

export async function fetchApi(path: string, init?: RequestInit): Promise<Response> {
  return fetch(toApiUrl(path), init);
}
