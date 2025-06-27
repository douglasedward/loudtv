import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Query,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
} from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from "@nestjs/swagger";

import { StreamKeysService } from "./stream-keys.service";
import { JwtAuthGuard } from "@/auth/guards/jwt-auth.guard";
import {
  StreamKeyResponseDto,
  StreamKeyHistoryResponseDto,
} from "./dto/stream-key.dto";
import { GetUser } from "@/auth/decorators/get-user.decorator";

@ApiTags("Stream Keys")
@Controller("stream-keys")
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class StreamKeysController {
  constructor(private readonly streamKeysService: StreamKeysService) {}

  @Post("generate")
  @ApiOperation({
    summary: "Generate a new stream key for the authenticated user",
  })
  @ApiResponse({
    status: 201,
    description: "Stream key generated successfully",
    type: StreamKeyResponseDto,
  })
  @ApiResponse({
    status: 409,
    description: "User already has an active stream key",
  })
  async generateStreamKey(
    @GetUser("id") userId: string,
  ): Promise<StreamKeyResponseDto> {
    return this.streamKeysService.generateStreamKey(userId);
  }

  @Put("regenerate")
  @ApiOperation({ summary: "Regenerate stream key for the authenticated user" })
  @ApiResponse({
    status: 200,
    description: "Stream key regenerated successfully",
    type: StreamKeyResponseDto,
  })
  async regenerateStreamKey(@Request() req): Promise<StreamKeyResponseDto> {
    return this.streamKeysService.regenerateStreamKey(req.user.id);
  }

  @Get()
  @ApiOperation({
    summary: "Get current active stream key for the authenticated user",
  })
  @ApiResponse({
    status: 200,
    description: "Stream key retrieved successfully",
    type: StreamKeyResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: "No active stream key found",
  })
  async getStreamKey(@GetUser() userId: string): Promise<StreamKeyResponseDto> {
    return this.streamKeysService.getStreamKey(userId);
  }

  @Post("validate/:streamKey")
  @ApiOperation({ summary: "Validate a stream key (used by streaming server)" })
  @ApiParam({
    name: "streamKey",
    description: "Stream key to validate",
    example: "sk_1234567890abcdef1234567890abcdef",
  })
  @ApiResponse({
    status: 200,
    description: "Stream key is valid",
    type: StreamKeyResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: "Invalid stream key",
  })
  @ApiResponse({
    status: 403,
    description: "User account is not active",
  })
  async validateStreamKey(
    @Param("streamKey") streamKey: string,
  ): Promise<StreamKeyResponseDto> {
    return this.streamKeysService.validateStreamKey(streamKey);
  }

  @Delete()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: "Revoke current stream key for the authenticated user",
  })
  @ApiResponse({
    status: 204,
    description: "Stream key revoked successfully",
  })
  @ApiResponse({
    status: 404,
    description: "No active stream key found",
  })
  async revokeStreamKey(@Request() req): Promise<void> {
    return this.streamKeysService.revokeStreamKey(req.user.id);
  }

  @Get("history")
  @ApiOperation({
    summary: "Get stream key history for the authenticated user",
  })
  @ApiQuery({
    name: "limit",
    required: false,
    description: "Number of stream keys to return",
    example: 10,
  })
  @ApiQuery({
    name: "offset",
    required: false,
    description: "Number of stream keys to skip",
    example: 0,
  })
  @ApiResponse({
    status: 200,
    description: "Stream key history retrieved successfully",
    type: StreamKeyHistoryResponseDto,
  })
  async getStreamKeyHistory(
    @Request() req,
    @Query("limit") limit?: number,
    @Query("offset") offset?: number,
  ): Promise<StreamKeyHistoryResponseDto> {
    return this.streamKeysService.getStreamKeyHistory(
      req.user.id,
      limit || 10,
      offset || 0,
    );
  }
}
