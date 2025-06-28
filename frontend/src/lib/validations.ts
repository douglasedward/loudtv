import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export const registerSchema = z
  .object({
    username: z.string().min(3, "Username must be at least 3 characters"),
    email: z.string().email("Invalid email address"),
    password: z.string().min(6, "Password must be at least 6 characters"),
    confirmPassword: z.string(),
    displayName: z
      .string()
      .min(2, "Display name must be at least 2 characters"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

export const channelSettingsSchema = z.object({
  title: z.string().min(1, "Title is required").max(100, "Title too long"),
  description: z.string().max(500, "Description too long"),
  category: z.string().min(1, "Category is required"),
  allowChat: z.boolean(),
  subscriberOnly: z.boolean(),
  moderationLevel: z.enum(["low", "medium", "high"]),
});

export const chatMessageSchema = z.object({
  message: z
    .string()
    .min(1, "Message cannot be empty")
    .max(500, "Message too long"),
});

export type LoginForm = z.infer<typeof loginSchema>;
export type RegisterForm = z.infer<typeof registerSchema>;
export type ChannelSettingsForm = z.infer<typeof channelSettingsSchema>;
export type ChatMessageForm = z.infer<typeof chatMessageSchema>;
