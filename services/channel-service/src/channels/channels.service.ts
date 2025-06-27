import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
  Logger,
} from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { Channel, ChannelDocument } from "./schemas/channel.schema";
import {
  CreateChannelDto,
  UpdateChannelDto,
  UpdateStreamSettingsDto,
  StartStreamDto,
  UpdateStreamInfoDto,
  EndStreamDto,
} from "./dto/channel.dto";
import { CacheService } from "../common/cache/cache.service";
import { SecurityService } from "../common/security/security.service";
import { InjectMetric } from "@willsoto/nestjs-prometheus";
import { Counter, Gauge } from "prom-client";

@Injectable()
export class ChannelsService {
  private readonly logger = new Logger(ChannelsService.name);

  constructor(
    @InjectModel(Channel.name)
    private readonly channelModel: Model<ChannelDocument>,
    private readonly cacheService: CacheService,
    private readonly securityService: SecurityService,
    @InjectMetric("channels_created_total")
    private readonly channelsCreatedCounter: Counter<string>,
    @InjectMetric("streams_started_total")
    private readonly streamsStartedCounter: Counter<string>,
    @InjectMetric("active_streams_gauge")
    private readonly activeStreamsGauge: Gauge<string>
  ) {}

  async create(
    username: string,
    createChannelDto: CreateChannelDto
  ): Promise<Channel> {
    try {
      // Check if user already has a channel
      const existingChannel = await this.channelModel.findOne({ username });
      if (existingChannel) {
        throw new ConflictException("User already has a channel");
      }

      // Sanitize input
      const sanitizedData = {
        ...createChannelDto,
        title: this.securityService.sanitizeInput(createChannelDto.title),
        description: createChannelDto.description
          ? this.securityService.sanitizeInput(createChannelDto.description)
          : undefined,
      };

      // Create channel
      const channel = new this.channelModel({
        ...sanitizedData,
        username,
      });

      const savedChannel = await channel.save();

      // Cache the channel
      const cacheKey = this.cacheService.generateKey(
        "channel",
        savedChannel.id
      );
      await this.cacheService.set(cacheKey, savedChannel.toJSON(), 3600);

      // Cache by user ID
      const userCacheKey = this.cacheService.generateKey(
        "channel-by-username",
        username
      );
      await this.cacheService.set(userCacheKey, savedChannel.toJSON(), 3600);

      // Update metrics
      this.channelsCreatedCounter.inc({ category: savedChannel.category });

      this.logger.log(
        `Channel created: ${savedChannel.id} for user ${username}`
      );
      return savedChannel;
    } catch (error) {
      this.logger.error(
        `Failed to create channel for user ${username}:`,
        error
      );
      throw error;
    }
  }

  async findById(channelId: string): Promise<ChannelDocument> {
    try {
      // Check cache first
      const cacheKey = this.cacheService.generateKey("channel", channelId);
      const cachedChannel =
        await this.cacheService.get<ChannelDocument>(cacheKey);

      if (cachedChannel) {
        return cachedChannel;
      }

      const channel = await this.channelModel.findById(channelId);
      if (!channel) {
        throw new NotFoundException("Channel not found");
      }

      // Cache the result
      await this.cacheService.set(cacheKey, channel.toJSON(), 3600);

      return channel;
    } catch (error) {
      this.logger.error(`Failed to get channel ${channelId}:`, error);
      throw error;
    }
  }

  async findByUsername(username: string): Promise<ChannelDocument> {
    try {
      // Check cache first
      const cacheKey = this.cacheService.generateKey(
        "channel-by-username",
        username
      );
      const cachedChannel =
        await this.cacheService.get<ChannelDocument>(cacheKey);

      if (cachedChannel) {
        return cachedChannel;
      }

      const channel = await this.channelModel.findOne({ username });
      if (!channel) {
        throw new NotFoundException("Channel not found for this user");
      }

      // Cache the result
      await this.cacheService.set(cacheKey, channel.toJSON(), 3600);

      return channel;
    } catch (error) {
      this.logger.error(`Failed to get channel for ${username}:`, error);
      throw error;
    }
  }

  async update(
    channelId: string,
    username: string,
    updateChannelDto: UpdateChannelDto
  ): Promise<Channel> {
    try {
      const channel = await this.findById(channelId);

      if (channel.username !== username) {
        throw new BadRequestException("You can only update your own channel");
      }

      // Sanitize input
      const sanitizedData: any = {};
      if (updateChannelDto.title) {
        sanitizedData.title = this.securityService.sanitizeInput(
          updateChannelDto.title
        );
      }
      if (updateChannelDto.description) {
        sanitizedData.description = this.securityService.sanitizeInput(
          updateChannelDto.description
        );
      }

      Object.assign(sanitizedData, {
        ...updateChannelDto,
        updatedAt: new Date(),
      });

      const updatedChannel = await this.channelModel.findByIdAndUpdate(
        channelId,
        sanitizedData,
        { new: true }
      );

      // Clear cache
      await this.clearCache(channelId, username);

      this.logger.log(`Channel updated: ${channelId}`);
      return updatedChannel;
    } catch (error) {
      this.logger.error(`Failed to update channel ${channelId}:`, error);
      throw error;
    }
  }

  async updateStreamSettings(
    channelId: string,
    username: string,
    settings: UpdateStreamSettingsDto
  ): Promise<Channel> {
    try {
      const channel = await this.findById(channelId);

      if (channel.username !== username) {
        throw new BadRequestException(
          "You can only update your own channel settings"
        );
      }

      const updatedChannel = await this.channelModel.findByIdAndUpdate(
        channelId,
        {
          $set: {
            streamSettings: { ...channel.streamSettings, ...settings },
            updatedAt: new Date(),
          },
        },
        { new: true }
      );

      // Clear cache
      await this.clearCache(channelId, username);

      this.logger.log(`Stream settings updated for channel: ${channelId}`);
      return updatedChannel;
    } catch (error) {
      this.logger.error(
        `Failed to update stream settings for channel ${channelId}:`,
        error
      );
      throw error;
    }
  }

  async startStream(
    streamId: string,
    username: string,
    streamData: StartStreamDto
  ): Promise<Channel> {
    try {
      const channel = await this.findByUsername(username);

      if (channel.username !== username) {
        throw new BadRequestException("You can only start your own stream");
      }

      if (channel.currentStream.isLive) {
        throw new ConflictException("Stream is already live");
      }

      const updatedChannel = await this.channelModel.findByIdAndUpdate(
        channel.id,
        {
          $set: {
            "currentStream.isLive": true,
            "currentStream.streamId": streamId,
            "currentStream.startedAt": streamData.startedAt,
            "streamSettings.quality": streamData.resolution,
            "streamSettings.bitrate": streamData.bitrate,
            "streamSettings.fps": streamData.fps,
            lastStreamAt: new Date(),
            updatedAt: new Date(),
          },
          $inc: {
            "stats.totalStreams": 1,
          },
        },
        { new: true }
      );

      // Clear cache
      await this.clearCache(channel.id, username);

      // Update metrics
      this.streamsStartedCounter.inc({ category: updatedChannel.category });
      this.activeStreamsGauge.inc();

      this.logger.log(`Stream started for channel: ${username}`);
      return updatedChannel;
    } catch (error) {
      this.logger.error(
        `Failed to start stream for channel ${username}:`,
        error
      );
      throw error;
    }
  }

  async endStream(
    username: string,
    streamData: EndStreamDto
  ): Promise<Channel> {
    try {
      const channel = await this.findByUsername(username);

      if (channel.username !== username) {
        throw new BadRequestException("You can only end your own stream");
      }

      if (!channel.currentStream.isLive) {
        throw new BadRequestException("Stream is not currently live");
      }

      const updatedChannel = await this.channelModel.findByIdAndUpdate(
        channel.id,
        {
          $set: {
            "currentStream.isLive": false,
            "currentStream.endedAt": streamData.endedAt,
            updatedAt: new Date(),
          },
          $inc: {
            "stats.totalWatchTime": Math.floor(streamData.duration / 1000),
          },
        },
        { new: true }
      );

      // Clear cache
      await this.clearCache(channel.id, username);

      // Update metrics
      this.activeStreamsGauge.dec();

      this.logger.log(`Stream ended for channel: ${username}`);
      return updatedChannel;
    } catch (error) {
      this.logger.error(`Failed to end stream for channel ${username}:`, error);
      throw error;
    }
  }

  async updateStreamInfo(
    channelId: string,
    username: string,
    streamInfo: UpdateStreamInfoDto
  ): Promise<Channel> {
    try {
      const channel = await this.findById(channelId);

      if (channel.username !== username) {
        throw new BadRequestException("You can only update your own stream");
      }

      if (!channel.currentStream.isLive) {
        throw new BadRequestException("Stream is not currently live");
      }

      const updateData: any = { updatedAt: new Date() };

      if (streamInfo.title) {
        updateData["currentStream.title"] = this.securityService.sanitizeInput(
          streamInfo.title
        );
      }

      if (streamInfo.category) {
        updateData.category = streamInfo.category;
      }

      const updatedChannel = await this.channelModel.findByIdAndUpdate(
        channelId,
        { $set: updateData },
        { new: true }
      );

      // Clear cache
      await this.clearCache(channelId, username);

      this.logger.log(`Stream info updated for channel: ${channelId}`);
      return updatedChannel;
    } catch (error) {
      this.logger.error(
        `Failed to update stream info for channel ${channelId}:`,
        error
      );
      throw error;
    }
  }

  async delete(channelId: string, userId: string): Promise<void> {
    try {
      const channel = await this.findById(channelId);

      if (channel.userId !== userId) {
        throw new BadRequestException("You can only delete your own channel");
      }

      if (channel.currentStream.isLive) {
        throw new BadRequestException(
          "Cannot delete channel while stream is live"
        );
      }

      await this.channelModel.findByIdAndDelete(channelId);

      // Clear cache
      await this.clearCache(channelId, userId);

      this.logger.log(`Channel deleted: ${channelId}`);
    } catch (error) {
      this.logger.error(`Failed to delete channel ${channelId}:`, error);
      throw error;
    }
  }

  async getLiveChannels(
    limit: number = 20,
    offset: number = 0
  ): Promise<Channel[]> {
    try {
      const channels = await this.channelModel
        .find({ "currentStream.isLive": true })
        .sort({ "currentStream.viewerCount": -1 })
        .limit(limit)
        .skip(offset)
        .exec();

      return channels;
    } catch (error) {
      this.logger.error("Failed to get live channels:", error);
      throw error;
    }
  }

  private async clearCache(channelId: string, username: string): Promise<void> {
    const cacheKey = this.cacheService.generateKey("channel", channelId);
    const usernameCacheKey = this.cacheService.generateKey(
      "channel-by-username",
      username
    );

    await Promise.all([
      this.cacheService.del(cacheKey),
      this.cacheService.del(usernameCacheKey),
    ]);
  }
}
