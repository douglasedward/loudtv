import { userApi } from "@/lib/api";
import { ApiResponse, LoginForm, RegisterForm, User } from "@/types";

export const authService = {
  async login(credentials: LoginForm): Promise<{ token: string; user: User }> {
    const response = await userApi.post("/auth/login", credentials);
    return response.data;
  },

  async register(
    userData: RegisterForm
  ): Promise<ApiResponse<{ token: string; user: User }>> {
    const response = await userApi.post("/auth/register", userData);
    return response.data;
  },

  async logout(): Promise<void> {
    await userApi.post("/auth/logout");
  },

  async getProfile(): Promise<User> {
    const response = await userApi.get("/auth/profile");
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

  async changePassword(data: {
    currentPassword: string;
    newPassword: string;
  }): Promise<void> {
    await userApi.put("/auth/change-password", data);
  },

  async deleteAccount(): Promise<void> {
    await userApi.delete("/auth/account");
  },

  async refreshToken(): Promise<{ token: string; user: User }> {
    const response = await userApi.post("/auth/refresh");
    return response.data;
  },
};
