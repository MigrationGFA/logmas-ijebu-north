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

/**
 * Turn whatever came back from a failed request into a sentence a person
 * can act on. Raw server and library text (database invocation dumps,
 * status-code strings, stack fragments) must never reach the screen:
 * a clean server message passes through, validation details become
 * plain field messages, and anything technical is replaced by a plain
 * fallback for the status. Every api.* call funnels through here, so
 * this one translation covers the whole app.
 */
function looksTechnical(message: string): boolean {
  return (
    message.length > 180 ||
    message.includes("\n") ||
    message.includes("`") ||
    /prisma|invocation|node_modules|Cannot read properties|Request failed with status/i.test(
      message,
    )
  );
}

function validationSummary(details: unknown): string | null {
  if (!details || typeof details !== "object") return null;
  const parts: string[] = [];
  for (const [field, value] of Object.entries(
    details as Record<string, unknown>,
  )) {
    if (field === "_errors") continue;
    const errors = (value as { _errors?: unknown })?._errors;
    if (Array.isArray(errors) && typeof errors[0] === "string") {
      const label = field
        .replace(/([A-Z])/g, " $1")
        .replace(/^./, (c) => c.toUpperCase());
      parts.push(`${label}: ${errors[0]}`);
    }
    if (parts.length >= 3) break;
  }
  return parts.length > 0 ? `Please check: ${parts.join("; ")}` : null;
}

export function humanizeErrorMessage(args: {
  message?: string | null;
  status?: number;
  backendCode?: string;
  backendDetails?: unknown;
}): string {
  const { message, status = 0, backendCode, backendDetails } = args;
  if (backendCode === "VALIDATION_ERROR" || (status === 400 && backendDetails)) {
    const summary = validationSummary(backendDetails);
    if (summary) return summary;
  }
  // No response at all means the request never reached the server
  // (offline, timeout, network down). Whatever the transport layer
  // called it ("Network Error" and friends), the person needs the
  // connection sentence, so this check comes before the pass-through.
  if (!status) {
    return "Connection problem. Check your network connection and try again.";
  }
  if (typeof message === "string" && message.trim() && !looksTechnical(message)) {
    return message;
  }
  switch (status) {
    case 400:
      return "That request could not be accepted. Please check the details and try again.";
    case 401:
      return "Your session has expired. Please sign in again.";
    case 403:
      return "You do not have permission to do that.";
    case 404:
      return "That could not be found. It may have been moved or removed.";
    case 409:
      return "That conflicts with a record that already exists.";
    default:
      return status >= 500
        ? "Something went wrong on our side. Please try again."
        : "Something went wrong. Please try again.";
  }
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
  // Field networks drop without cleanly closing connections, and with
  // no timeout axios waits on the OS for minutes: the form just spins
  // and the officer sees no response at all. Twenty seconds is long
  // for any JSON call here, and failing fast is what lets the offline
  // queue capture and the error messages do their job.
  timeout: 20000,
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
  // Same reasoning as the main instance: a hung refresh would queue
  // every other request behind it indefinitely.
  timeout: 15000,
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
        // A network failure is not an expired session. When the refresh
        // call never reached the server (no response at all, for example
        // the device is offline), the right move is to fail this request
        // quietly and leave the session exactly as it was. Clearing the
        // tokens and hard redirecting here is what used to throw field
        // officers out of the app and into a login reload loop the
        // moment their network dropped.
        const isNetworkFailure = !(refreshError as { response?: unknown })
          ?.response;
        if (isNetworkFailure) {
          return Promise.reject(refreshError);
        }
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
      const envError =
        env.error && typeof env.error === "object" ? (env.error as any) : undefined;
      const rawMessage =
        typeof env.error === "string" ? env.error : envError?.message;
      throw new ApiError(
        humanizeErrorMessage({
          message: rawMessage,
          status: 400,
          backendCode: envError?.code,
          backendDetails: envError?.details,
        }),
        400,
        undefined,
        envError?.code,
        envError?.details,
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
    const envError =
      env?.error && typeof env.error === "object" ? (env.error as any) : undefined;

    const rawMessage =
      (typeof env?.error === "string" ? env.error : envError?.message) ??
      (typeof env?.data === "string" ? env.data : undefined) ??
      err.message;

    return new ApiError(
      humanizeErrorMessage({
        message: rawMessage,
        status: err.response?.status ?? 0,
        backendCode: envError?.code,
        backendDetails: envError?.details,
      }),
      err.response?.status ?? 0,
      err.code,
      envError?.code,
      envError?.details,
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
      // Uploads ride the slowest links in the field; give them a
      // minute before failing, unless the caller set its own timeout.
      timeout: config?.timeout ?? 60000,
      headers: {
        ...(config?.headers ?? {}),
        "Content-Type": "multipart/form-data",
      },
    }),
};

export { axiosInstance };
