export interface User {
  id: string;
  username: string;
  email: string;
  displayName?: string;
  bio?: string;
  avatarUrl?: string;
  isStreamer: boolean;
  isVerified: boolean;
  isActive: boolean;
  emailVerified: boolean;

  // Privacy Settings
  isPublicProfile: boolean;
  showEmail: boolean;
  allowFollowerMessages: boolean;
  showActivityStatus: boolean;

  // Notification Settings
  emailOnNewFollower: boolean;
  emailOnStreamEvents: boolean;
  pushOnNewFollower: boolean;
  pushOnStreamEvents: boolean;

  // Timestamps
  lastLoginAt?: Date;
  createdAt: Date;
  updatedAt: Date;

  // Relations
  following: Follower[];
  followers: Follower[];
  streamKeys: StreamKey[];

  // Virtual properties
  followersCount?: number;
  followingCount?: number;
}

export interface Follower {
  id: string;
  followerId: string;
  followingId: string;
  followedAt: Date;
}

export interface StreamKey {
  id: string;
  userId: string;
  streamKey: string;
  streamUrl: string;
  isActive: boolean;
  lastUsedAt: Date | null;
  usageCount: number;
  createdAt: Date;
  updatedAt: Date;
}

// Form types for validation
export interface LoginForm {
  email: string;
  password: string;
}

export interface RegisterForm {
  username: string;
  email: string;
  password: string;
  displayName: string;
}

export interface ChannelSettingsForm {
  title: string;
  description?: string;
  category: string;
}

export interface ChatMessageForm {
  message: string;
}

export interface Channel {
  id: string;
  title: string;
  description: string;
  category: string;
  language: string;
  userId: string;
  username: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  currentStream: {
    isLive: boolean;
    viewerCount: number;
    peakViewers: number;
    _id: string;
  };
  moderation: {
    status: string;
    reports: number;
    _id: string;
  };
  stats: {
    totalViews: number;
    totalStreams: number;
    followersCount: number;
    averageViewers: number;
    totalWatchTime: number;
  };
  streamSettings: {
    quality: string;
    bitrate: number;
    fps: number;
    enableChat: boolean;
    chatMode: string;
  };
}

export interface Stream {
  id: string;
  channelId: string;
  title: string;
  isLive: boolean;
  viewerCount: number;
  startedAt: string;
  endedAt?: string;
  quality: {
    resolution: string;
    bitrate: number;
    fps: number;
  };
  hlsUrl?: string;
  dashUrl?: string;
}

export interface ChatMessage {
  id: string;
  channelId: string;
  userId: string;
  username: string;
  message: string;
  timestamp: string;
  badges: string[];
  emotes?: {
    name: string;
    url: string;
    position: [number, number];
  }[];
}

export interface Notification {
  id: string;
  type: "stream_live" | "follower" | "donation" | "system";
  title: string;
  message: string;
  read: boolean;
  timestamp: string;
  data?: Record<string, unknown>;
}

export interface StreamQuality {
  label: string;
  resolution: string;
  bitrate: number;
  fps: number;
  url: string;
}

export interface ViewerStats {
  concurrent: number;
  peak: number;
  total: number;
  countries: Record<string, number>;
  devices: Record<string, number>;
}

export interface StreamAnalytics {
  id: string;
  channelId: string;
  date: string;
  viewers: ViewerStats;
  engagement: {
    chatMessages: number;
    averageWatchTime: number;
    likes: number;
    shares: number;
  };
  technical: {
    averageBitrate: number;
    bufferingEvents: number;
    qualityChanges: number;
    errors: number;
  };
}

export interface ApiResponse<T = any> {
  message?: string;
  data?: T;
  error?: string;
  statusCode?: number;
  timestamp?: string;
}
