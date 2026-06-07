export const API_BASE_URL = "https://score-care-service.onrender.com";

export function apiUrl(path: string) {
  return `${API_BASE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}
