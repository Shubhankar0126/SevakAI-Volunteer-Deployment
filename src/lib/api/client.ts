import axios, { AxiosError, type InternalAxiosRequestConfig } from "axios";

type RetriableConfig = InternalAxiosRequestConfig & {
  _retry?: boolean;
};

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || "/api";
const refreshClient = axios.create({
  baseURL: apiBaseUrl,
  withCredentials: true,
});

export const apiClient = axios.create({
  baseURL: apiBaseUrl,
  withCredentials: true,
});

let refreshPromise: Promise<void> | null = null;

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const config = error.config as RetriableConfig | undefined;
    const status = error.response?.status;
    const url = config?.url ?? "";
    const isAuthEndpoint =
      url.includes("/auth/login") ||
      url.includes("/auth/register") ||
      url.includes("/auth/refresh") ||
      url.includes("/auth/me");

    if (status === 401 && config && !config._retry && !isAuthEndpoint) {
      config._retry = true;

      if (!refreshPromise) {
        refreshPromise = refreshClient
          .post("/auth/refresh")
          .then(() => undefined)
          .finally(() => {
            refreshPromise = null;
          });
      }

      try {
        await refreshPromise;
        return apiClient(config);
      } catch (refreshError) {
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  },
);

export function extractApiData<T>(payload: { data: T }) {
  return payload.data;
}

export function getApiErrorMessage(error: unknown) {
  if (axios.isAxiosError<{ message?: string; errors?: Array<{ message?: string }> }>(error)) {
    return (
      error.response?.data?.message ??
      error.response?.data?.errors?.[0]?.message ??
      error.message ??
      "Request failed."
    );
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "Request failed.";
}

export function getSocketBaseUrl() {
  return import.meta.env.VITE_SOCKET_URL || undefined;
}
