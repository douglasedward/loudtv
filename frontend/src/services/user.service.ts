import { userApi } from "@/lib/api";
import { User } from "@/types";

export const userService = {
  async updateProfile(data: Partial<User>): Promise<User> {
    const response = await userApi.put("/users/profile", data);
    return response.data;
  },

  async followUser(userId: string): Promise<void> {
    await userApi.post(`/users/${userId}/follow`);
  },

  async unfollowUser(userId: string): Promise<void> {
    await userApi.delete(`/users/${userId}/follow`);
  },

  async getFollowers(userId: string): Promise<User[]> {
    const response = await userApi.get(`/users/${userId}/followers`);
    return response.data;
  },

  async getFollowing(userId: string): Promise<User[]> {
    const response = await userApi.get(`/users/${userId}/following`);
    return response.data;
  },

  async uploadAvatar(formData: FormData): Promise<User> {
    const response = await userApi.post("/users/avatar", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data;
  },

  async deleteAccount(): Promise<void> {
    await userApi.delete("/auth/account");
  },

  async refreshToken(): Promise<{ token: string; user: User }> {
    const response = await userApi.post("/auth/refresh");
    return response.data;
  },
};
