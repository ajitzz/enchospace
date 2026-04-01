
export async function fetchApi<T = any>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });

  const contentType = response.headers.get('content-type');
  const isJson = contentType && contentType.includes('application/json');

  if (!response.ok) {
    let errorMessage = `API Error: ${response.status} ${response.statusText}`;
    if (isJson) {
      const errorData = await response.json();
      errorMessage = errorData.error || errorData.message || errorMessage;
    } else {
      const text = await response.text();
      console.error(`Non-JSON Error Response from ${url}:`, text);
    }
    throw new Error(errorMessage);
  }

  if (isJson) {
    return await response.json();
  }

  return {} as T;
}
