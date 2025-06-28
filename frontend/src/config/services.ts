// Service configuration interface
export interface ServiceConfig {
  baseURL: string;
  version?: string;
  timeout?: number;
  requiresAuth?: boolean;
}

// Default service configurations
export const SERVICE_CONFIGS: Record<string, ServiceConfig> = {
  user: {
    baseURL:
      process.env.NEXT_PUBLIC_USER_SERVICE_URL || "http://localhost:3001",
    version: "api/v1",
    timeout: 10000,
    requiresAuth: true,
  },
  channel: {
    baseURL:
      process.env.NEXT_PUBLIC_CHANNEL_SERVICE_URL || "http://localhost:3002",
    version: "api/v1",
    timeout: 10000,
    requiresAuth: true,
  },
  "stream-ingest": {
    baseURL:
      process.env.NEXT_PUBLIC_STREAM_INGEST_SERVICE_URL ||
      "http://localhost:3003",
    version: "api/v1",
    timeout: 15000,
    requiresAuth: true,
  },
  transcoding: {
    baseURL:
      process.env.NEXT_PUBLIC_TRANSCODING_SERVICE_URL ||
      "http://localhost:3004",
    version: "api/v1",
    timeout: 30000,
    requiresAuth: true,
  },
  "cdn-management": {
    baseURL:
      process.env.NEXT_PUBLIC_CDN_MANAGEMENT_SERVICE_URL ||
      "http://localhost:3005",
    version: "api/v1",
    timeout: 10000,
    requiresAuth: true,
  },
  chat: {
    baseURL:
      process.env.NEXT_PUBLIC_CHAT_SERVICE_URL || "http://localhost:3006",
    version: "api/v1",
    timeout: 10000,
    requiresAuth: true,
  },
  analytics: {
    baseURL:
      process.env.NEXT_PUBLIC_ANALYTICS_SERVICE_URL || "http://localhost:3007",
    version: "api/v1",
    timeout: 10000,
    requiresAuth: true,
  },
};
