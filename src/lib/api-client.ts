export function csrfToken() {
  if (typeof document === "undefined") return "";
  return document.cookie.split("; ").find((row) => row.startsWith("oneai_csrf="))?.split("=")[1] ?? "";
}

export async function api<T>(url: string, init: RequestInit = {}): Promise<T> {
  const method = (init.method ?? "GET").toUpperCase();
  const headers = new Headers(init.headers);
  if (!(init.body instanceof FormData)) headers.set("Content-Type", "application/json");
  if (!["GET", "HEAD", "OPTIONS"].includes(method)) headers.set("x-oneai-csrf", csrfToken());
  const response = await fetch(url, { ...init, headers, credentials: "same-origin" });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payload.error ?? `Request failed (${response.status})`);
  return payload as T;
}
