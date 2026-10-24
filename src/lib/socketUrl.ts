import { API_BASE_URL } from "./apiBaseUrl";

export function getSocketUrl(): string {
  if (process.env.NEXT_PUBLIC_SOCKET_URL) {
    return process.env.NEXT_PUBLIC_SOCKET_URL;
  }

  if (typeof window !== "undefined") {
    const isLocalhost =
      window.location.hostname === "localhost" ||
      window.location.hostname === "127.0.0.1";

    if (isLocalhost) {
      return "http://localhost:8080";
    }
  }

  // في الإنتاج، استخلاص الرابط بدون /api
  return API_BASE_URL.replace(/\/api\/?$/, "");
}
