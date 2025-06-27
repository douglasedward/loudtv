import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
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
import { ThrottlerGuard } from "@nestjs/throttler";
import { ChannelsService } from "./channels.service";
import {
  CreateChannelDto,
  UpdateChannelDto,
  UpdateStreamSettingsDto,
  UpdateStreamInfoDto,
} from "./dto/channel.dto";
import { JwtAuthGuard } from "../common/guards/jwt-auth.guard";

@ApiTags("channels")
@Controller("channels")
@UseGuards(ThrottlerGuard)
export class ChannelsController {
  constructor(private readonly channelsService: ChannelsService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Create a new channel" })
  @ApiResponse({ status: 201, description: "Channel created successfully" })
  @ApiResponse({ status: 400, description: "Bad request" })
  @ApiResponse({ status: 409, description: "User already has a channel" })
  async createChannel(
    @Request() req,
    @Body() createChannelDto: CreateChannelDto
  ) {
    return this.channelsService.create(req.user.id, createChannelDto);
  }

  @Get(":id")
  @ApiOperation({ summary: "Get channel by ID" })
  @ApiParam({ name: "id", description: "Channel ID" })
  @ApiResponse({ status: 200, description: "Channel found" })
  @ApiResponse({ status: 404, description: "Channel not found" })
  async getChannelById(@Param("id") id: string) {
    return this.channelsService.findById(id);
  }

  @Get("user/:username")
  @ApiOperation({ summary: "Get channel by username" })
  @ApiParam({ name: "username", description: "Username" })
  @ApiResponse({ status: 200, description: "Channel found" })
  @ApiResponse({ status: 404, description: "Channel not found" })
  async getChannelByUserId(@Param("username") username: string) {
    return this.channelsService.findByUsername(username);
  }

  @Put(":id")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Update channel information" })
  @ApiParam({ name: "id", description: "Channel ID" })
  @ApiResponse({ status: 200, description: "Channel updated successfully" })
  @ApiResponse({ status: 400, description: "Bad request" })
  @ApiResponse({ status: 404, description: "Channel not found" })
  async updateChannel(
    @Param("id") id: string,
    @Request() req,
    @Body() updateChannelDto: UpdateChannelDto
  ) {
    return this.channelsService.update(id, req.user.id, updateChannelDto);
  }

  @Put(":id/settings")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Update stream settings" })
  @ApiParam({ name: "id", description: "Channel ID" })
  @ApiResponse({
    status: 200,
    description: "Stream settings updated successfully",
  })
  @ApiResponse({ status: 400, description: "Bad request" })
  async updateStreamSettings(
    @Param("id") id: string,
    @Request() req,
    @Body() settings: UpdateStreamSettingsDto
  ) {
    return this.channelsService.updateStreamSettings(id, req.user.id, settings);
  }

  @Get(":id/stream-status")
  @ApiOperation({ summary: "Get stream status" })
  @ApiParam({ name: "id", description: "Channel ID" })
  @ApiResponse({ status: 200, description: "Stream status retrieved" })
  async getStreamStatus(@Param("id") id: string) {
    const channel = await this.channelsService.findById(id);
    return {
      isLive: channel.currentStream.isLive,
      streamId: channel.currentStream.streamId,
      title: channel.currentStream.title,
      startedAt: channel.currentStream.startedAt,
      viewerCount: channel.currentStream.viewerCount,
      peakViewers: channel.currentStream.peakViewers,
    };
  }

  @Put(":id/stream-info")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Update stream information while live" })
  @ApiParam({ name: "id", description: "Channel ID" })
  @ApiResponse({ status: 200, description: "Stream info updated successfully" })
  @ApiResponse({ status: 400, description: "Bad request or stream not live" })
  async updateStreamInfo(
    @Param("id") id: string,
    @Request() req,
    @Body() streamInfo: UpdateStreamInfoDto
  ) {
    return this.channelsService.updateStreamInfo(id, req.user.id, streamInfo);
  }

  @Delete(":id")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Delete channel" })
  @ApiParam({ name: "id", description: "Channel ID" })
  @ApiResponse({ status: 200, description: "Channel deleted successfully" })
  @ApiResponse({ status: 400, description: "Bad request or stream is live" })
  @HttpCode(HttpStatus.OK)
  async deleteChannel(@Param("id") id: string, @Request() req) {
    await this.channelsService.delete(id, req.user.id);
    return { message: "Channel deleted successfully" };
  }

  @Get("live")
  @ApiOperation({ summary: "Get live channels" })
  @ApiQuery({
    name: "limit",
    required: false,
    description: "Number of channels to return",
    example: 20,
  })
  @ApiQuery({
    name: "offset",
    required: false,
    description: "Number of channels to skip",
    example: 0,
  })
  @ApiResponse({ status: 200, description: "Live channels retrieved" })
  async getLiveChannels(
    @Query("limit") limit: string = "20",
    @Query("offset") offset: string = "0"
  ) {
    return this.channelsService.getLiveChannels(
      parseInt(limit),
      parseInt(offset)
    );
  }
}
