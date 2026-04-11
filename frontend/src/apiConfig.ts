// Central API configuration
// In development, we use the Vite proxy (empty string)
// In production, we use the VITE_API_URL environment variable from Render

export const API_BASE_URL = import.meta.env.VITE_API_URL || "";

/**
 * Helper to build the full API URL
 * @param path The API endpoint path (e.g., '/api/users/login')
 */
export const getApiUrl = (path: string) => {
  // If the path already has a protocol, return it as is
  if (path.startsWith("http")) return path;
  
  // Combine base URL and path, ensuring no double slashes
  const baseUrl = API_BASE_URL.replace(/\/$/, "");
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  
  return `${baseUrl}${normalizedPath}`;
};
