import { userApi as api } from "@/lib/api";
import { StreamAnalytics, ViewerStats } from "@/types";

export const analyticsService = {
  async getStreamAnalytics(
    channelId: string,
    dateRange: { start: string; end: string }
  ): Promise<StreamAnalytics[]> {
    const response = await api.get(`/analytics/streams/${channelId}`, {
      params: dateRange,
    });
    return response.data;
  },

  async getLiveViewerStats(channelId: string): Promise<ViewerStats> {
    const response = await api.get(
      `/analytics/streams/${channelId}/live-stats`
    );
    return response.data;
  },

  async getDashboardStats(channelId: string): Promise<{
    totalViews: number;
    totalWatchTime: number;
    averageWatchTime: number;
    peakViewers: number;
    recentStreams: number;
    followerGrowth: number;
  }> {
    const response = await api.get(`/analytics/dashboard/${channelId}`);
    return response.data;
  },

  async trackStreamView(
    channelId: string,
    metadata: {
      device?: string;
      browser?: string;
      country?: string;
      quality?: string;
    }
  ): Promise<void> {
    await api.post(`/analytics/streams/${channelId}/view`, metadata);
  },

  async trackStreamInteraction(
    channelId: string,
    interaction: {
      type: "like" | "share" | "follow" | "chat_message";
      metadata?: Record<string, unknown>;
    }
  ): Promise<void> {
    await api.post(`/analytics/streams/${channelId}/interaction`, interaction);
  },

  async getPopularCategories(): Promise<
    Array<{ category: string; viewerCount: number; streamCount: number }>
  > {
    const response = await api.get("/analytics/categories/popular");
    return response.data;
  },

  async getRealtimeMetrics(): Promise<{
    totalViewers: number;
    totalStreams: number;
    topStreams: Array<{ channelId: string; title: string; viewers: number }>;
  }> {
    const response = await api.get("/analytics/realtime");
    return response.data;
  },
};
