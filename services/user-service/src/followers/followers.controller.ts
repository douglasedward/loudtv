import {
  Controller,
  Post,
  Delete,
  Get,
  Param,
  UseGuards,
  Query,
  ParseUUIDPipe,
  ParseIntPipe,
} from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from "@nestjs/swagger";

import { FollowersService } from "./followers.service";
import {
  FollowersResponseDto,
  FollowingResponseDto,
} from "./dto/followers.dto";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { GetUser } from "../auth/decorators/get-user.decorator";
import { Follower } from "./entities/follower.entity";

@ApiTags("followers")
@Controller("users")
export class FollowersController {
  constructor(private readonly followersService: FollowersService) {}

  @Post(":id/follow")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth("JWT-auth")
  @ApiOperation({ summary: "Follow a user" })
  @ApiParam({
    name: "id",
    description: "ID of the user to follow",
    example: "123e4567-e89b-12d3-a456-426614174000",
  })
  @ApiResponse({
    status: 201,
    description: "Successfully followed user",
    type: Follower,
  })
  @ApiResponse({
    status: 400,
    description: "Cannot follow yourself",
  })
  @ApiResponse({
    status: 404,
    description: "User not found",
  })
  @ApiResponse({
    status: 409,
    description: "Already following this user",
  })
  async followUser(
    @GetUser("id") followerId: string,
    @Param("id", ParseUUIDPipe) followingId: string,
  ): Promise<Follower> {
    return this.followersService.followUser(followerId, followingId);
  }

  @Delete(":id/follow")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth("JWT-auth")
  @ApiOperation({ summary: "Unfollow a user" })
  @ApiParam({
    name: "id",
    description: "ID of the user to unfollow",
    example: "123e4567-e89b-12d3-a456-426614174000",
  })
  @ApiResponse({
    status: 200,
    description: "Successfully unfollowed user",
  })
  @ApiResponse({
    status: 404,
    description: "Follow relationship not found",
  })
  async unfollowUser(
    @GetUser("id") followerId: string,
    @Param("id", ParseUUIDPipe) followingId: string,
  ): Promise<{ message: string }> {
    await this.followersService.unfollowUser(followerId, followingId);
    return { message: "Successfully unfollowed user" };
  }

  @Get(":id/followers")
  @ApiOperation({ summary: "Get user followers" })
  @ApiParam({
    name: "id",
    description: "User ID",
    example: "123e4567-e89b-12d3-a456-426614174000",
  })
  @ApiQuery({
    name: "limit",
    description: "Number of followers to return",
    example: 20,
    required: false,
  })
  @ApiQuery({
    name: "offset",
    description: "Number of followers to skip",
    example: 0,
    required: false,
  })
  @ApiResponse({
    status: 200,
    description: "List of followers",
    type: FollowersResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: "User not found",
  })
  async getFollowers(
    @Param("id", ParseUUIDPipe) userId: string,
    @Query("limit", new ParseIntPipe({ optional: true })) limit: number = 20,
    @Query("offset", new ParseIntPipe({ optional: true })) offset: number = 0,
  ): Promise<FollowersResponseDto> {
    return this.followersService.getFollowers(userId, limit, offset);
  }

  @Get(":id/following")
  @ApiOperation({ summary: "Get users followed by user" })
  @ApiParam({
    name: "id",
    description: "User ID",
    example: "123e4567-e89b-12d3-a456-426614174000",
  })
  @ApiQuery({
    name: "limit",
    description: "Number of following to return",
    example: 20,
    required: false,
  })
  @ApiQuery({
    name: "offset",
    description: "Number of following to skip",
    example: 0,
    required: false,
  })
  @ApiResponse({
    status: 200,
    description: "List of users being followed",
    type: FollowingResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: "User not found",
  })
  async getFollowing(
    @Param("id", ParseUUIDPipe) userId: string,
    @Query("limit", new ParseIntPipe({ optional: true })) limit: number = 20,
    @Query("offset", new ParseIntPipe({ optional: true })) offset: number = 0,
  ): Promise<FollowingResponseDto> {
    return this.followersService.getFollowing(userId, limit, offset);
  }

  @Get(":id/followers/check/:targetId")
  @ApiOperation({ summary: "Check if user is following another user" })
  @ApiParam({
    name: "id",
    description: "Follower user ID",
    example: "123e4567-e89b-12d3-a456-426614174000",
  })
  @ApiParam({
    name: "targetId",
    description: "Target user ID",
    example: "123e4567-e89b-12d3-a456-426614174001",
  })
  @ApiResponse({
    status: 200,
    description: "Following status",
    schema: {
      type: "object",
      properties: {
        isFollowing: {
          type: "boolean",
          example: true,
        },
      },
    },
  })
  async checkIfFollowing(
    @Param("id", ParseUUIDPipe) followerId: string,
    @Param("targetId", ParseUUIDPipe) followingId: string,
  ): Promise<{ isFollowing: boolean }> {
    const isFollowing = await this.followersService.isFollowing(
      followerId,
      followingId,
    );
    return { isFollowing };
  }
}
