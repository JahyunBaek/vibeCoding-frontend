export type { ApiError, ApiResponse } from "@/types/api";
export { apiRequest, refresh } from "@/lib/client";

import { authApi } from "./auth";
import { boardApi } from "./board";
import { adminApi } from "./admin";
import { tenantApi } from "./tenant";
import { notificationApi } from "./notification";
import { sampleApi } from "./sample";
import { agentApi } from "./agent";

export const api = {
  ...authApi,
  ...boardApi,
  ...adminApi,
  ...tenantApi,
  ...notificationApi,
  ...sampleApi,
  ...agentApi,
};
