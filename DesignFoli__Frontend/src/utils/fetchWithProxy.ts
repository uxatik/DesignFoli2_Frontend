/**
 * Helper function to make API calls through the Next.js proxy
 * This avoids CORS issues by routing requests through our own server
 */

interface FetchWithProxyOptions extends Omit<RequestInit, 'body'> {
  body?: unknown;
}

export async function fetchWithProxy(
  endpoint: string,
  options: FetchWithProxyOptions = {}
): Promise<Response> {
  // Remove /api/v1/ prefix if it exists, as the proxy will add it
  const cleanEndpoint = endpoint.replace(/^\/api\/v1\//, '');
  
  // Build the proxy URL
  const proxyUrl = `/api/proxy/${cleanEndpoint}`;
  
  // Prepare headers
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  // Handle body serialization
  let body: BodyInit | undefined;
  if (options.body) {
    if (typeof options.body === 'string') {
      body = options.body;
    } else {
      body = JSON.stringify(options.body);
    }
  }

  // Prepare fetch options
  const fetchOptions: RequestInit = {
    ...options,
    headers,
    body,
  };

  return fetch(proxyUrl, fetchOptions);
}

/**
 * Converts a backend URL to use the proxy
 * Usage: const url = getProxyUrl('/users/profile')
 */
export function getProxyUrl(endpoint: string): string {
  const cleanEndpoint = endpoint.replace(/^\/api\/v1\//, '');
  return `/api/proxy/${cleanEndpoint}`;
}
