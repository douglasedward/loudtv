import { SERVICE_CONFIGS, ServiceConfig } from "@/config/services";
import axios, { AxiosInstance } from "axios";

// Factory function to create API instances for each service
const createApiInstance = (
  serviceName: string,
  customConfig?: Partial<ServiceConfig>
): AxiosInstance => {
  const serviceConfig = SERVICE_CONFIGS[serviceName];
  if (!serviceConfig) {
    throw new Error(`Service configuration not found for: ${serviceName}`);
  }

  const config = { ...serviceConfig, ...customConfig };
  const fullBaseURL = config.version
    ? `${config.baseURL}/${config.version}`
    : config.baseURL;

  const api = axios.create({
    baseURL: fullBaseURL,
    timeout: config.timeout,
    headers: {
      "Content-Type": "application/json",
    },
  });

  // Add auth interceptor if required
  if (config.requiresAuth) {
    api.interceptors.request.use(
      (requestConfig) => {
        const token = localStorage.getItem("auth_token");
        if (token) {
          requestConfig.headers.Authorization = `Bearer ${token}`;
        }
        return requestConfig;
      },
      (error) => {
        return Promise.reject(error);
      }
    );
  }

  // Response interceptor for error handling
  api.interceptors.response.use(
    (response) => response,
    (error) => {
      if (error.response?.status === 401 && config.requiresAuth) {
        localStorage.removeItem("auth_token");
        window.location.href = "/auth/login";
      }
      return Promise.reject(error);
    }
  );

  return api;
};

// Create API instances for each service
export const userApi = createApiInstance("user");
export const channelApi = createApiInstance("channel");
export const chatApi = createApiInstance("chat");
export const analyticsApi = createApiInstance("analytics");
export const streamIngestApi = createApiInstance("stream-ingest");
export const transcodingApi = createApiInstance("transcoding");
export const cdnManagementApi = createApiInstance("cdn-management");
