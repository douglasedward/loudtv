import {
  IsString,
  IsEmail,
  IsOptional,
  MaxLength,
  IsBoolean,
} from "class-validator";
import { ApiPropertyOptional } from "@nestjs/swagger";

export class UpdateUserDto {
  @ApiPropertyOptional({
    description: "Username for the user",
    example: "streamer123",
    maxLength: 50,
  })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  username?: string;

  @ApiPropertyOptional({
    description: "Display name for the user",
    example: "John Streamer",
    maxLength: 100,
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  displayName?: string;

  @ApiPropertyOptional({
    description: "User biography",
    example: "Professional gamer and content creator",
  })
  @IsOptional()
  @IsString()
  bio?: string;

  @ApiPropertyOptional({
    description: "URL to user avatar image",
    example: "https://example.com/avatars/user123.jpg",
  })
  @IsOptional()
  @IsString()
  avatarUrl?: string;

  @ApiPropertyOptional({
    description: "Whether the user is a streamer",
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  isStreamer?: boolean;
}

export class UserProfileDto {
  id: string;

  username: string;

  @ApiPropertyOptional({
    description: "User email address",
    example: "user@example.com",
  })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({
    description: "Display name for the user",
    example: "John Streamer",
    maxLength: 100,
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  displayName?: string;

  @ApiPropertyOptional({
    description: "User biography",
    example: "Professional gamer and content creator",
  })
  @IsOptional()
  @IsString()
  bio?: string;

  @ApiPropertyOptional({
    description: "URL to user avatar image",
    example: "https://example.com/avatars/user123.jpg",
  })
  @IsOptional()
  @IsString()
  avatarUrl?: string;

  isStreamer: boolean;
  isVerified: boolean;
  isActive: boolean;
  emailVerified: boolean;
  followersCount: number;
  followingCount: number;
  createdAt: Date;
  updatedAt: Date;
  lastLoginAt?: Date;
}

export class UserPrivacySettingsDto {
  @ApiPropertyOptional({
    description: "Whether profile is public",
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  isPublicProfile?: boolean;

  @ApiPropertyOptional({
    description: "Whether to show email publicly",
    example: false,
  })
  @IsOptional()
  @IsBoolean()
  showEmail?: boolean;

  @ApiPropertyOptional({
    description: "Whether to allow followers to send messages",
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  allowFollowerMessages?: boolean;

  @ApiPropertyOptional({
    description: "Whether to show activity status",
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  showActivityStatus?: boolean;
}

export class UserNotificationSettingsDto {
  @ApiPropertyOptional({
    description: "Email notifications for new followers",
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  emailOnNewFollower?: boolean;

  @ApiPropertyOptional({
    description: "Email notifications for stream events",
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  emailOnStreamEvents?: boolean;

  @ApiPropertyOptional({
    description: "Push notifications for new followers",
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  pushOnNewFollower?: boolean;

  @ApiPropertyOptional({
    description: "Push notifications for stream events",
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  pushOnStreamEvents?: boolean;
}
