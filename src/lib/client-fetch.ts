/** Client-side API fetch that avoids stale cached dashboard/project data. */
export function apiFetch(input: RequestInfo | URL, init?: RequestInit) {
  return fetch(input, {
    ...init,
    cache: "no-store",
    credentials: init?.credentials ?? "include",
  });
}
