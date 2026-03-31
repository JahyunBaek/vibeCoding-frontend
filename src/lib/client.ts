import axios, { AxiosError, AxiosInstance, AxiosRequestConfig, AxiosResponse } from "axios";
import { useAuthStore } from "@/stores/auth";
import type { ApiResponse } from "@/types/api";

// --------------------------------------------
// axios instance
// --------------------------------------------
const client: AxiosInstance = axios.create({
  baseURL: "",            // same-origin
  withCredentials: true,  // ✅ refresh cookie 전송
  timeout: 15000,
});

// --------------------------------------------
// refresh 상태 + 대기 큐
// --------------------------------------------
let isRefreshing = false;
let refreshPromise: Promise<boolean> | null = null;

type Pending = {
  resolve: (value: AxiosResponse<any>) => void;
  reject: (reason?: any) => void;
  config: AxiosRequestConfig & { _retry?: boolean };
};
let pendingQueue: Pending[] = [];

function isAuthUrl(url: string | undefined) {
  if (!url) return false;
  return (
    url.includes("/api/auth/login") ||
    url.includes("/api/auth/logout") ||
    url.includes("/api/auth/refresh")
  );
}

function flushQueueSuccess() {
  const q = pendingQueue;
  pendingQueue = [];
  for (const item of q) {
    client
      .request(item.config)
      .then(item.resolve)
      .catch(item.reject);
  }
}

function flushQueueFail(err: any) {
  const q = pendingQueue;
  pendingQueue = [];
  for (const item of q) item.reject(err);
}

// --------------------------------------------
// request interceptor: access token 자동 첨부
// --------------------------------------------
client.interceptors.request.use((config) => {
  const { accessToken } = useAuthStore.getState();
  if (accessToken) {
    config.headers = config.headers ?? {};
    (config.headers as any)["Authorization"] = `Bearer ${accessToken}`;
  }
  return config;
});

// --------------------------------------------
// refresh 함수 (single-flight)
// --------------------------------------------
export async function refresh(): Promise<boolean> {
  if (refreshPromise) return refreshPromise;

  refreshPromise = (async () => {
    try {
      const res = await axios.post<ApiResponse<{ accessToken: string; user: any }>>(
        "/api/auth/refresh",
        null,
        { withCredentials: true }
      );

      if (!res.data?.success) return false;

      useAuthStore.getState().setAuth(res.data.data.accessToken, res.data.data.user);
      return true;
    } catch {
      useAuthStore.getState().clear();
      return false;
    } finally {
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

// --------------------------------------------
// response interceptor: 401 처리 + 큐잉
// --------------------------------------------
client.interceptors.response.use(
  (r) => r,
  async (error: AxiosError<any>) => {
    const status = error.response?.status;
    const original = error.config as (AxiosRequestConfig & { _retry?: boolean }) | undefined;

    if (!original) throw error;

    const url = original.url;

    if (status !== 401) throw error;
    if (isAuthUrl(url)) throw error;
    if (original._retry) throw error;
    original._retry = true;

    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        pendingQueue.push({ resolve, reject, config: original });
      });
    }

    isRefreshing = true;
    const ok = await refresh();
    isRefreshing = false;

    if (ok) {
      flushQueueSuccess();
      return client.request(original);
    } else {
      const err = new Error("Refresh failed");
      flushQueueFail(err);
      throw error;
    }
  }
);

// --------------------------------------------
// 공통 apiRequest
// --------------------------------------------
export async function apiRequest<T>(
  method: string,
  url: string,
  body?: any,
  opts?: { isFormData?: boolean; headers?: Record<string, string> }
): Promise<T> {
  try {
    const res = await client.request<ApiResponse<T>>({
      method,
      url,
      data: body,
      headers: opts?.isFormData
        ? opts?.headers
        : { "Content-Type": "application/json", ...opts?.headers },
    });
    const json = res.data;
    if (!json?.success) {
      const msg = json?.error?.message || "Request failed";
      throw new Error(msg);
    }
    return json.data;
  } catch (e: any) {
    if (axios.isAxiosError(e)) {
      const data = e.response?.data as ApiResponse<any> | undefined;
      const msg =
        data?.error?.message ||
        e.message ||
        `Request failed (${e.response?.status ?? "unknown"})`;
      throw new Error(msg);
    }
    throw e;
  }
}

export { client };
