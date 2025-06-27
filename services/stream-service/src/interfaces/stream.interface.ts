export interface StreamSession {
  id: string;
  streamKey: string;
  userId: string;
  username: string;
  protocol: "rtmp" | "webrtc";
  status: "connecting" | "active" | "inactive" | "error";
  startedAt: Date;
  lastActivity: Date;
  bitrate?: number;
  resolution?: string;
  fps?: number;
  codec?: string;
}

export interface StreamMetrics {
  streamId: string;
  bitrate: number;
  fps: number;
  resolution: string;
  codec: string;
  dropped_frames: number;
  duration: number;
  timestamp: Date;
}

export interface StreamEvent {
  eventType:
    | "stream.started"
    | "stream.ended"
    | "stream.updated"
    | "stream.error";
  streamId: string;
  userId: string;
  data: Record<string, unknown>;
  timestamp: Date;
}

export interface UserValidationResponse {
  valid: boolean;
  userId?: string;
  username?: string;
  message?: string;
}

export interface StreamValidationResult {
  valid: boolean;
  metrics?: StreamMetrics;
  errors?: string[];
}

export interface User {
  id: string;
  username: string;
  email: string;
  passwordHash: string;
  displayName: string;
  bio: string | null;
  avatarUrl: string | null;
  isStreamer: boolean;
  isVerified: boolean;
  isActive: boolean;
  emailVerified: boolean;
  isPublicProfile: boolean;
  showEmail: boolean;
  allowFollowerMessages: boolean;
  showActivityStatus: boolean;
  emailOnNewFollower: boolean;
  emailOnStreamEvents: boolean;
  pushOnNewFollower: boolean;
  pushOnStreamEvents: boolean;
  lastLoginAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface StreamKeyData {
  id: string;
  userId: string;
  streamKey: string;
  streamUrl: string;
  isActive: boolean;
  lastUsedAt: string;
  usageCount: number;
  createdAt: string;
  updatedAt: string;
  user: User;
}

export interface ApiResponse<T = any> {
  data: T;
  statusCode: number;
  message: string;
  timestamp: string;
}

export type StreamKeyValidationResponse = ApiResponse<StreamKeyData>;
