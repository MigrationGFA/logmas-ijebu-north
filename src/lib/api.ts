/* eslint-disable @typescript-eslint/no-explicit-any */
import axios, { AxiosError, type AxiosRequestConfig } from "axios";
import { API_BASE_URL, ENV } from "../config/env";
import { tokenManager } from "@/services/apiAuth";
import { toast } from "sonner";

const TOKEN_KEY = "logmas.auth.token";
const REFRESH_TOKEN_KEY = "logmas.auth.refreshToken";

export class ApiError extends Error {
  status: number;
  code?: string;
  /**
   * Application error code sent by the backend, e.g. "NOT_FOUND",
   * "AMOUNT_MISMATCH", "VALIDATION_ERROR". `code` keeps carrying the axios
   * code ("ERR_BAD_REQUEST"), so this is the field to branch on for business
   * logic.
   */
  backendCode?: string;
  /**
   * Field-level validation details when the backend rejects a payload, e.g.
   * { email: { _errors: ["Invalid email address"] } }.
   */
  backendDetails?: unknown;
  constructor(
    message: string,
    status = 0,
    code?: string,
    backendCode?: string,
    backendDetails?: unknown,
  ) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.backendCode = backendCode;
    this.backendDetails = backendDetails;
  }
}

export interface ApiEnvelope<T = unknown> {
  status: "success" | "error";
  data: T;
  error: string | null;
}

export function getAuthToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(TOKEN_KEY);
}

export function setAuthToken(token: string | null) {
  if (typeof window === "undefined") return;
  if (token) window.localStorage.setItem(TOKEN_KEY, token);
  else window.localStorage.removeItem(TOKEN_KEY);
}

export function getRefreshToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(REFRESH_TOKEN_KEY);
}

export function setRefreshToken(token: string | null) {
  if (typeof window === "undefined") return;
  if (token) window.localStorage.setItem(REFRESH_TOKEN_KEY, token);
  else window.localStorage.removeItem(REFRESH_TOKEN_KEY);
}

// Log the API URL being used (helpful for debugging)
console.log(`API running in ${ENV.IS_DEV ? "DEVELOPMENT" : "PRODUCTION"} mode`);
console.log(`API Base URL: ${API_BASE_URL}`);

const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: { "Content-Type": "application/json" },
});

/**
 * Dedicated instance for the token-refresh call. It intentionally has NO
 * response interceptor: the refresh request must never re-enter the 401
 * refresh logic below. If it did, a failed refresh would queue itself into
 * `failedQueue` while `isRefreshing` is already true and await
 * `processQueue` — which only the (now-blocked) outer flow can call —
 * deadlocking the app in a permanent loading state until the cache is cleared.
 */
const refreshAxios = axios.create({
  baseURL: API_BASE_URL,
  headers: { "Content-Type": "application/json" },
});

// Request interceptor for adding token
axiosInstance.interceptors.request.use((config) => {
  if (
    config.headers?.Authorization === "" ||
    config.headers?.Authorization === false ||
    config.headers?.["skip-auth"]
  ) {
    if (config.headers) {
      delete (config.headers as any).Authorization;
      delete (config.headers as any)["skip-auth"];
    }
    return config;
  }

  const token = getAuthToken();
  if (token) {
    config.headers = config.headers ?? {};
    (config.headers as Record<string, string>).Authorization =
      `Bearer ${token}`;
  }
  return config;
});

// Response interceptor for handling token refresh
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value: unknown) => void;
  reject: (reason?: unknown) => void;
}> = [];

const processQueue = (error: Error | null, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
        const status = error.response?.status;
    const errorCode = error.response?.data?.code;

     if (status === 403 && errorCode === 'SUSPENDED') {
      // Clear tokens and user data
      tokenManager.clearAllTokens();
      // Show a clear message (sonner toast)
      toast.error('Account suspended. Contact LGA Secretariat.', {
        duration: 6000,
      });
      // Redirect to login with a query param to show the message
      window.location.href = '/login?reason=suspended';
      return Promise.reject(error);
    }

    // If error is 401 and we haven't tried to refresh yet
    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        // Queue the request while token is being refreshed
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return axiosInstance(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const refreshToken = getRefreshToken();
      if (!refreshToken) {
        isRefreshing = false;
        setAuthToken(null);
        setRefreshToken(null);
        tokenManager.clearAllTokens();
        return Promise.reject(error);
      }

      try {
        // Use the interceptor-free instance so a failed refresh can't re-enter
        // this handler and deadlock (see refreshAxios above).
        const response = await refreshAxios.post<{
          data?: { accessToken: string };
          accessToken?: string;
        }>("/auth/refresh", { refreshToken });

        // Backend wraps the payload in an envelope ({ status, data }); tolerate
        // a flat { accessToken } shape too.
        const newAccessToken =
          response.data?.data?.accessToken ?? response.data?.accessToken;
        if (!newAccessToken) {
          throw new Error("Refresh succeeded but returned no access token");
        }
        setAuthToken(newAccessToken);

        processQueue(null, newAccessToken);
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        return axiosInstance(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError as Error, null);
        // Refresh token invalid/expired - hard-stop instead of leaving the app
        // stuck on a spinner. Clear everything and send the user to login.
        setAuthToken(null);
        setRefreshToken(null);
        tokenManager.clearAllTokens();
        if (typeof window !== "undefined") {
          window.location.href = "/login?reason=expired";
        }
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  },
);
function unwrap<T>(envelope: ApiEnvelope<T> | T): T {
  if (!envelope || typeof envelope !== "object") {
    return envelope as T;
  }

  const obj = envelope as Record<string, unknown>;

  // Helper to check if object is array-like
  const isArrayLike = (obj: Record<string, unknown>): boolean => {
    const keys = Object.keys(obj);
    const numericKeys = keys.filter((key) => !isNaN(Number(key)));
    return (
      numericKeys.length > 0 &&
      keys.some((key) => key === "meta" || key === "error")
    );
  };

  // Case 1: Proper API envelope with status and data
  if ("status" in obj && "data" in obj) {
    const env = envelope as ApiEnvelope<T>;
    if (env.status === "error") {
      // 💡 FIX: Safely parse out string messages from object-shaped errors
      let errorMessage = "Request failed";
      if (typeof env.error === "string") {
        errorMessage = env.error;
      } else if (env.error && typeof env.error === "object") {
        errorMessage = (env.error as any).message || JSON.stringify(env.error);
      }

      throw new ApiError(
        errorMessage,
        400,
        undefined,
        env.error && typeof env.error === "object"
          ? (env.error as any).code
          : undefined,
        env.error && typeof env.error === "object"
          ? (env.error as any).details
          : undefined,
      );
    }
    return env.data;
  }

  // Case 2: Object with data property (THIS IS YOUR VERCEL CASE)
  if ("data" in obj) {
    // Check if data is an array and we're expecting an array
    const data = obj.data;
    if (Array.isArray(data)) {
      return data as T;
    }
    // If data is an object, return it
    return data as T;
  }

  // Case 3: Vercel array wrapper { 0: {...}, meta: null, error: null }
  if (isArrayLike(obj)) {
    const result: any[] = [];
    Object.keys(obj).forEach((key) => {
      if (!isNaN(Number(key))) {
        result[Number(key)] = obj[key];
      }
    });
    return result as T;
  }

  // Case 4: Raw response
  return envelope as T;
}

function toApiError(err: unknown): ApiError {
  if (err instanceof AxiosError) {
    const env = err.response?.data as ApiEnvelope<unknown> | undefined;

    // 💡 FIX: Safely handle nested error objects in response interceptor failure cases too
    let msg = "Network error";
    if (env?.error) {
      msg =
        typeof env.error === "string"
          ? env.error
          : (env.error as any).message || JSON.stringify(env.error);
    } else if (typeof env?.data === "string") {
      msg = env.data;
    } else {
      msg = err.message || msg;
    }

    return new ApiError(
      msg,
      err.response?.status ?? 0,
      err.code,
      env?.error && typeof env.error === "object"
        ? (env.error as any).code
        : undefined,
      env?.error && typeof env.error === "object"
        ? (env.error as any).details
        : undefined,
    );
  }
  if (err instanceof ApiError) return err;
  if (err instanceof Error) return new ApiError(err.message);
  return new ApiError("Unknown error");
}

async function request<T>(config: AxiosRequestConfig): Promise<T> {
  try {
    const res = await axiosInstance.request<ApiEnvelope<T>>(config);
    return unwrap<T>(res.data);
  } catch (err) {
    throw toApiError(err);
  }
}

export const api = {
  get: <T>(url: string, config?: AxiosRequestConfig) =>
    request<T>({ ...config, method: "GET", url }),
  post: <T>(url: string, data?: unknown, config?: AxiosRequestConfig) =>
    request<T>({ ...config, method: "POST", url, data }),
  put: <T>(url: string, data?: unknown, config?: AxiosRequestConfig) =>
    request<T>({ ...config, method: "PUT", url, data }),
  patch: <T>(url: string, data?: unknown, config?: AxiosRequestConfig) =>
    request<T>({ ...config, method: "PATCH", url, data }),
  delete: <T>(url: string, config?: AxiosRequestConfig) =>
    request<T>({ ...config, method: "DELETE", url }),
  upload: <T>(url: string, formData: FormData, config?: AxiosRequestConfig) =>
    request<T>({
      ...config,
      method: config?.method || "POST",
      url,
      data: formData,
      headers: {
        ...(config?.headers ?? {}),
        "Content-Type": "multipart/form-data",
      },
    }),
};

export { axiosInstance };
