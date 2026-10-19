// Helper to get API URL based on environment
const getApiUrl = () => {
  // Check for explicit env variable first
  if (process.env.NEXT_PUBLIC_API_BASE_URL) {
    return process.env.NEXT_PUBLIC_API_BASE_URL;
  }

  // Development fallback
  if (process.env.NODE_ENV === "development") {
    return "http://localhost:3006/api/v1";
  }

  // Production fallback (you'll replace this with your actual URL)
  return "https://your-domain.com/api/v1";
};

export const API_BASE_URL = getApiUrl();

// Export other env vars
export const ENV = {
  API_BASE_URL,
  IS_DEV: process.env.NODE_ENV === "development",
  IS_PROD: process.env.NODE_ENV === "production",
  GOOGLE_CLIENT_ID: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "",
};
