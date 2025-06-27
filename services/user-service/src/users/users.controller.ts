import {
  Controller,
  Get,
  Put,
  Post,
  Delete,
  Param,
  Body,
  UseGuards,
  Query,
  ParseUUIDPipe,
  ParseIntPipe,
  HttpCode,
  HttpStatus,
  UnauthorizedException,
} from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from "@nestjs/swagger";

import { UsersService } from "./users.service";
import {
  UpdateUserDto,
  UserProfileDto,
  UserPrivacySettingsDto,
  UserNotificationSettingsDto,
} from "./dto/user.dto";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { GetUser } from "../auth/decorators/get-user.decorator";
import { User } from "./entities/user.entity";
import { PaginatedResult } from "@/common/performance/database-performance.service";

@ApiTags("users")
@Controller("users")
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get(":id/profile")
  @ApiOperation({ summary: "Get user profile by ID" })
  @ApiParam({
    name: "id",
    description: "User ID",
    example: "123e4567-e89b-12d3-a456-426614174000",
  })
  @ApiResponse({
    status: 200,
    description: "User profile retrieved successfully",
    type: UserProfileDto,
  })
  @ApiResponse({
    status: 404,
    description: "User not found",
  })
  async getUserProfile(
    @Param("id", ParseUUIDPipe) id: string,
  ): Promise<UserProfileDto> {
    return this.usersService.getUserProfile(id);
  }

  @Get("username/:username")
  @ApiOperation({ summary: "Get user profile by username" })
  @ApiParam({
    name: "username",
    description: "Username",
    example: "streamer123",
  })
  @ApiResponse({
    status: 200,
    description: "User profile retrieved successfully",
    type: UserProfileDto,
  })
  @ApiResponse({
    status: 404,
    description: "User not found",
  })
  async getUserByUsername(
    @Param("username") username: string,
  ): Promise<UserProfileDto> {
    const user = await this.usersService.findByUsername(username);
    return this.usersService.getUserProfile(user.id);
  }

  @Put("profile")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth("JWT-auth")
  @ApiOperation({ summary: "Update current user profile" })
  @ApiResponse({
    status: 200,
    description: "Profile updated successfully",
    type: UserProfileDto,
  })
  @ApiResponse({
    status: 401,
    description: "Unauthorized",
  })
  @ApiResponse({
    status: 409,
    description: "Username already taken",
  })
  async updateProfile(
    @GetUser("id") userId: string,
    @Body() updateUserDto: UpdateUserDto,
  ): Promise<UserProfileDto> {
    return this.usersService.updateProfile(userId, updateUserDto);
  }

  @Get("search")
  @ApiOperation({ summary: "Search users" })
  @ApiQuery({
    name: "q",
    description: "Search query",
    required: true,
    example: "streamer",
  })
  @ApiQuery({
    name: "limit",
    description: "Number of results per page",
    required: false,
    example: 20,
  })
  @ApiQuery({
    name: "cursor",
    description: "Pagination cursor",
    required: false,
  })
  @ApiResponse({
    status: 200,
    description: "Users found successfully",
  })
  async searchUsers(
    @Query("q") query: string,
    @Query("limit", new ParseIntPipe({ optional: true })) limit?: number,
    @Query("cursor") cursor?: string,
  ): Promise<PaginatedResult<User>> {
    return this.usersService.searchUsers(query, {
      limit,
      cursor,
    });
  }

  @Get("streamers")
  @ApiOperation({ summary: "Get list of streamers" })
  @ApiQuery({
    name: "limit",
    description: "Number of results to return",
    example: 20,
    required: false,
  })
  @ApiQuery({
    name: "offset",
    description: "Number of results to skip",
    example: 0,
    required: false,
  })
  @ApiResponse({
    status: 200,
    description: "List of streamers",
    type: [User],
  })
  async getStreamers(
    @Query("limit", new ParseIntPipe({ optional: true })) limit: number = 20,
    @Query("offset", new ParseIntPipe({ optional: true })) offset: number = 0,
  ): Promise<User[]> {
    return await this.usersService.getStreamers(limit, offset);
  }

  @Get("settings/privacy")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth("JWT-auth")
  @ApiOperation({ summary: "Get user privacy settings" })
  @ApiResponse({
    status: 200,
    description: "Privacy settings retrieved successfully",
    type: UserPrivacySettingsDto,
  })
  async getPrivacySettings(
    @GetUser("id") userId: string,
  ): Promise<UserPrivacySettingsDto> {
    return await this.usersService.getPrivacySettings(userId);
  }

  @Put("settings/privacy")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth("JWT-auth")
  @ApiOperation({ summary: "Update user privacy settings" })
  @ApiResponse({
    status: 200,
    description: "Privacy settings updated successfully",
  })
  async updatePrivacySettings(
    @GetUser("id") userId: string,
    @Body() settings: UserPrivacySettingsDto,
  ): Promise<void> {
    return await this.usersService.updatePrivacySettings(userId, settings);
  }

  @Get("settings/notifications")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth("JWT-auth")
  @ApiOperation({ summary: "Get user notification settings" })
  @ApiResponse({
    status: 200,
    description: "Notification settings retrieved successfully",
    type: UserNotificationSettingsDto,
  })
  async getNotificationSettings(
    @GetUser("id") userId: string,
  ): Promise<UserNotificationSettingsDto> {
    return await this.usersService.getNotificationSettings(userId);
  }

  @Put("settings/notifications")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth("JWT-auth")
  @ApiOperation({ summary: "Update user notification settings" })
  @ApiResponse({
    status: 200,
    description: "Notification settings updated successfully",
  })
  async updateNotificationSettings(
    @GetUser("id") userId: string,
    @Body() settings: UserNotificationSettingsDto,
  ): Promise<void> {
    return await this.usersService.updateNotificationSettings(userId, settings);
  }

  @Post("password/change")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth("JWT-auth")
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: "Change user password" })
  @ApiResponse({
    status: 204,
    description: "Password changed successfully",
  })
  @ApiResponse({
    status: 400,
    description: "Password validation failed",
  })
  async changePassword(
    @GetUser("id") userId: string,
    @Body() changePasswordDto: { currentPassword: string; newPassword: string },
  ): Promise<void> {
    return this.usersService.changePassword(
      userId,
      changePasswordDto.currentPassword,
      changePasswordDto.newPassword,
    );
  }

  @Get("paginated")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth("JWT-auth")
  @ApiOperation({ summary: "Get paginated users list (admin only)" })
  @ApiQuery({
    name: "page",
    description: "Page number",
    required: false,
    example: 1,
  })
  @ApiQuery({
    name: "limit",
    description: "Number of results per page",
    required: false,
    example: 20,
  })
  @ApiResponse({
    status: 200,
    description: "Users retrieved successfully",
  })
  async getPaginatedUsers(
    @Query("page", new ParseIntPipe({ optional: true })) page?: number,
    @Query("limit", new ParseIntPipe({ optional: true })) limit?: number,
  ): Promise<PaginatedResult<User>> {
    return this.usersService.getPaginatedUsers({
      page,
      limit,
    });
  }

  @Delete(":id/account")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth("JWT-auth")
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: "Delete user account (GDPR compliance)" })
  @ApiParam({
    name: "id",
    description: "User ID",
    example: "123e4567-e89b-12d3-a456-426614174000",
  })
  @ApiResponse({
    status: 204,
    description: "User account deleted successfully",
  })
  async deleteAccount(
    @Param("id", ParseUUIDPipe) userId: string,
    @GetUser("id") currentUserId: string,
  ): Promise<void> {
    // Only allow users to delete their own account
    if (userId !== currentUserId) {
      throw new UnauthorizedException("Access denied");
    }
    return this.usersService.deleteUserAccount(userId);
  }
}
