import { handleLocalApi, LocalApiError } from "@/lib/local-db/api";

function isLocalApiUrl(url: string) {
  const path = url.startsWith("http")
    ? new URL(url).pathname
    : url.split("?")[0];
  return path.startsWith("/api/") && !path.startsWith("/api/auth/");
}

export async function requestJson<T>(
  url: string,
  options?: RequestInit,
): Promise<T> {
  if (typeof window !== "undefined" && isLocalApiUrl(url)) {
    try {
      return handleLocalApi(url, options) as T;
    } catch (error) {
      if (error instanceof LocalApiError) {
        throw new Error(error.message);
      }
      throw error;
    }
  }

  const response = await fetch(url, {
    cache: "no-store",
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options?.headers ?? {}),
    },
  });

  const payload = (await response.json().catch(() => ({}))) as T & {
    error?: string;
  };

  if (!response.ok) {
    throw new Error(payload.error ?? "Request failed");
  }

  return payload;
}
