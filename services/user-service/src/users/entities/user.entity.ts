import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  OneToMany,
} from "typeorm";
import { Exclude } from "class-transformer";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Follower } from "@/followers/entities/follower.entity";
import { StreamKey } from "@/stream-keys/entities/stream-key.entity";

@Entity("users")
@Index(["email"], { unique: true })
@Index(["username"], { unique: true })
export class User {
  @ApiProperty({
    description: "Unique identifier of the user",
    example: "123e4567-e89b-12d3-a456-426614174000",
  })
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @ApiProperty({
    description: "Unique username",
    example: "streamer123",
    minLength: 3,
    maxLength: 50,
  })
  @Column({ length: 50, unique: true })
  username: string;

  @ApiProperty({
    description: "User email address",
    example: "user@example.com",
  })
  @Column({ unique: true })
  email: string;

  @Exclude()
  @Column({ name: "password_hash" })
  passwordHash: string;

  @ApiPropertyOptional({
    description: "Display name for the user",
    example: "John Streamer",
    maxLength: 100,
  })
  @Column({ name: "display_name", length: 100, nullable: true })
  displayName?: string;

  @ApiPropertyOptional({
    description: "User biography",
    example: "Professional gamer and content creator",
  })
  @Column({ type: "text", nullable: true })
  bio?: string;

  @ApiPropertyOptional({
    description: "URL to user avatar image",
    example: "https://example.com/avatars/user123.jpg",
  })
  @Column({ name: "avatar_url", length: 500, nullable: true })
  avatarUrl?: string;

  @ApiProperty({
    description: "Whether the user is a streamer",
    example: true,
  })
  @Column({ name: "is_streamer", default: false })
  isStreamer: boolean;

  @ApiProperty({
    description: "Whether the user is verified",
    example: false,
  })
  @Column({ name: "is_verified", default: false })
  isVerified: boolean;

  @ApiProperty({
    description: "Whether the user account is active",
    example: true,
  })
  @Column({ name: "is_active", default: true })
  isActive: boolean;

  @ApiProperty({
    description: "Whether the email is verified",
    example: false,
  })
  @Column({ name: "email_verified", default: false })
  emailVerified: boolean;

  // Privacy Settings
  @ApiProperty({
    description: "Whether profile is public",
    example: true,
  })
  @Column({ name: "is_public_profile", default: true })
  isPublicProfile: boolean;

  @ApiProperty({
    description: "Whether to show email publicly",
    example: false,
  })
  @Column({ name: "show_email", default: false })
  showEmail: boolean;

  @ApiProperty({
    description: "Whether to allow followers to send messages",
    example: true,
  })
  @Column({ name: "allow_follower_messages", default: true })
  allowFollowerMessages: boolean;

  @ApiProperty({
    description: "Whether to show activity status",
    example: true,
  })
  @Column({ name: "show_activity_status", default: true })
  showActivityStatus: boolean;

  // Notification Settings
  @ApiProperty({
    description: "Email notifications for new followers",
    example: true,
  })
  @Column({ name: "email_on_new_follower", default: true })
  emailOnNewFollower: boolean;

  @ApiProperty({
    description: "Email notifications for stream events",
    example: true,
  })
  @Column({ name: "email_on_stream_events", default: true })
  emailOnStreamEvents: boolean;

  @ApiProperty({
    description: "Push notifications for new followers",
    example: true,
  })
  @Column({ name: "push_on_new_follower", default: true })
  pushOnNewFollower: boolean;

  @ApiProperty({
    description: "Push notifications for stream events",
    example: true,
  })
  @Column({ name: "push_on_stream_events", default: true })
  pushOnStreamEvents: boolean;

  @ApiPropertyOptional({
    description: "Last login date",
    example: "2024-01-15T12:00:00.000Z",
  })
  @Column({ name: "last_login_at", nullable: true })
  lastLoginAt?: Date;

  @ApiProperty({
    description: "Account creation date",
    example: "2024-01-01T12:00:00.000Z",
  })
  @CreateDateColumn({ name: "created_at" })
  createdAt: Date;

  @ApiProperty({
    description: "Last account update date",
    example: "2024-01-15T12:00:00.000Z",
  })
  @UpdateDateColumn({ name: "updated_at" })
  updatedAt: Date;

  // Relations
  @OneToMany(() => Follower, (follower) => follower.follower)
  following: Follower[];

  @OneToMany(() => Follower, (follower) => follower.following)
  followers: Follower[];

  @OneToMany(() => StreamKey, (streamKey) => streamKey.user)
  streamKeys: StreamKey[];

  // Virtual properties
  @ApiPropertyOptional({
    description: "Number of followers",
    example: 1250,
  })
  followersCount?: number;

  @ApiPropertyOptional({
    description: "Number of users following",
    example: 75,
  })
  followingCount?: number;

  constructor(partial: Partial<User>) {
    Object.assign(this, partial);
  }
}
