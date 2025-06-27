import {
  IsEmail,
  IsString,
  MinLength,
  MaxLength,
  IsOptional,
  IsBoolean,
} from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

export class RegisterDto {
  @ApiProperty({
    description: "Unique username for the user",
    example: "streamer123",
    minLength: 3,
    maxLength: 50,
  })
  @IsString()
  @MinLength(3)
  @MaxLength(50)
  username: string;

  @ApiProperty({
    description: "Email address of the user",
    example: "user@example.com",
  })
  @IsEmail()
  email: string;

  @ApiProperty({
    description: "Password for the user account",
    example: "strongPassword123!",
    minLength: 8,
  })
  @IsString()
  @MinLength(8)
  password: string;

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
    description: "Whether the user wants to be a streamer",
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  isStreamer?: boolean;
}

export class LoginDto {
  @ApiProperty({
    description: "Email address",
    example: "user@example.com",
  })
  @IsEmail()
  email: string;

  @ApiProperty({
    description: "User password",
    example: "strongPassword123!",
  })
  @IsString()
  password: string;
}

export class RefreshTokenDto {
  @ApiProperty({
    description: "Refresh token",
    example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  })
  @IsString()
  refreshToken: string;
}

export class ForgotPasswordDto {
  @ApiProperty({
    description: "Email address to send reset instructions",
    example: "user@example.com",
  })
  @IsEmail()
  email: string;
}

export class ResetPasswordDto {
  @ApiProperty({
    description: "Password reset token",
    example: "reset-token-123",
  })
  @IsString()
  token: string;

  @ApiProperty({
    description: "New password",
    example: "newStrongPassword123!",
    minLength: 8,
  })
  @IsString()
  @MinLength(8)
  newPassword: string;
}

export class VerifyEmailDto {
  @ApiProperty({
    description: "Email verification token",
    example: "verify-token-123",
  })
  @IsString()
  token: string;
}

export class AuthResponseDto {
  @ApiProperty({
    description: "User information",
  })
  user: any;

  @ApiProperty({
    description: "JWT access token",
    example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  })
  token: string;

  @ApiPropertyOptional({
    description: "JWT access token (alias for token)",
    example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  })
  accessToken?: string;

  @ApiPropertyOptional({
    description: "JWT refresh token",
    example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  })
  refreshToken?: string;
}
