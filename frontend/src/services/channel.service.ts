import { channelApi } from "@/lib/api";
import { Channel, ChannelSettingsForm } from "@/types";

export const channelService = {
  async findAll(
    params: {
      page?: number;
      limit?: number;
      category?: string;
    } = { page: 1, limit: 20 }
  ): Promise<{ channels: Channel[]; total: number }> {
    const response = await channelApi.get("/channels", { params });
    return response.data;
  },

  async findById(id: string): Promise<Channel> {
    const response = await channelApi.get(`/channels/${id}`);
    return response.data;
  },

  async findByUsername(username: string): Promise<Channel> {
    const response = await channelApi.get(`/channels/user/${username}`);
    console.log(`Fetching channel by username: ${username}`, response);

    return response.data;
  },

  async getLive(): Promise<Channel[]> {
    const response = await channelApi.get("/channels/live");
    return response.data;
  },

  async getTrending(): Promise<Channel[]> {
    const response = await channelApi.get("/channels/trending");
    return response.data;
  },

  async searchChannels(query: string): Promise<Channel[]> {
    const response = await channelApi.get(
      `/channels/search?q=${encodeURIComponent(query)}`
    );
    return response.data;
  },

  async createChannel(channelData: ChannelSettingsForm): Promise<Channel> {
    const response = await channelApi.post("/channels", channelData);
    return response.data;
  },

  async updateChannel(id: string, channelData: any): Promise<Channel> {
    const response = await channelApi.put(`/channels/${id}`, channelData);
    return response.data;
  },

  async deleteChannel(id: string): Promise<void> {
    const response = await channelApi.delete(`/channels/${id}`);
    return response.data;
  },

  async generateStreamKey(channelId: string): Promise<{ streamKey: string }> {
    const response = await channelApi.post(`/channels/${channelId}/stream-key`);
    return response.data;
  },

  async getStreamHealth(channelId: string): Promise<{
    isLive: boolean;
    bitrate: number;
    fps: number;
    resolution: string;
    viewers: number;
  }> {
    const response = await channelApi.get(
      `/channels/${channelId}/stream-health`
    );
    return response.data;
  },

  // Channel subscriptions
  subscribeToChannel: (channelId: string) =>
    channelApi.post(`/channels/${channelId}/subscribe`),

  unsubscribeFromChannel: (channelId: string) =>
    channelApi.delete(`/channels/${channelId}/subscribe`),

  getChannelSubscribers: (channelId: string) =>
    channelApi.get(`/channels/${channelId}/subscribers`),

  // Channel streams
  getChannelStreams: (channelId: string) =>
    channelApi.get(`/channels/${channelId}/streams`),

  startStream: (channelId: string, streamData: any) =>
    channelApi.post(`/channels/${channelId}/streams`, streamData),

  endStream: (channelId: string, streamId: string) =>
    channelApi.patch(`/channels/${channelId}/streams/${streamId}/end`),
};

export default channelService;
