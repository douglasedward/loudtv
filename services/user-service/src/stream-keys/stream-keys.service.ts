import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import * as crypto from "crypto";

import { StreamKey } from "./entities/stream-key.entity";
import { User } from "../users/entities/user.entity";
import { EventsService } from "../events/events.service";
import { MetricsService } from "../metrics/metrics.service";

@Injectable()
export class StreamKeysService {
  constructor(
    @InjectRepository(StreamKey)
    private readonly streamKeyRepository: Repository<StreamKey>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly eventsService: EventsService,
    private readonly metricsService: MetricsService,
  ) {}

  async generateStreamKey(userId: string): Promise<StreamKey> {
    // Check if user exists and is active
    const user = await this.userRepository.findOne({
      where: { id: userId, isActive: true },
    });

    if (!user) {
      throw new NotFoundException("User not found");
    }

    // Check if user already has an active stream key
    const existingKey = await this.streamKeyRepository.findOne({
      where: { userId, isActive: true },
    });

    if (existingKey) {
      throw new ConflictException("User already has an active stream key");
    }

    // Generate unique stream key and URL
    const streamKey = this.generateUniqueKey();
    const streamUrl = `rtmp://localhost:1935/live/${streamKey}`;

    // Create stream key
    const newStreamKey = this.streamKeyRepository.create({
      userId,
      streamKey,
      streamUrl,
      isActive: true,
    });

    const savedKey = await this.streamKeyRepository.save(newStreamKey);

    // TODO - Publish stream key created event

    // Track metric
    this.metricsService.incrementUserOperation(
      "stream_key_generated",
      "success",
    );

    return savedKey;
  }

  async regenerateStreamKey(userId: string): Promise<StreamKey> {
    // Check if user exists
    const user = await this.userRepository.findOne({
      where: { id: userId, isActive: true },
    });

    if (!user) {
      throw new NotFoundException("User not found");
    }

    // Deactivate existing stream key
    await this.streamKeyRepository.update(
      { userId, isActive: true },
      { isActive: false },
    );

    // Generate new stream key
    const streamKey = this.generateUniqueKey();
    const streamUrl = `rtmp://localhost:1935/live/${streamKey}`;

    const newStreamKey = this.streamKeyRepository.create({
      userId,
      streamKey,
      streamUrl,
      isActive: true,
    });

    const savedKey = await this.streamKeyRepository.save(newStreamKey);

    // TODO - Publish stream key regenerated event

    // Track metric
    this.metricsService.incrementUserOperation(
      "stream_key_regenerated",
      "success",
    );

    return savedKey;
  }

  async getStreamKey(userId: string): Promise<StreamKey> {
    const streamKey = await this.streamKeyRepository.findOne({
      where: { userId, isActive: true },
      relations: ["user"],
    });

    if (!streamKey) {
      throw new NotFoundException("No active stream key found for user");
    }

    return streamKey;
  }

  async validateStreamKey(streamKey: string): Promise<StreamKey> {
    const key = await this.streamKeyRepository.findOne({
      where: { streamKey, isActive: true },
      relations: ["user"],
    });

    if (!key) {
      throw new NotFoundException("Invalid stream key");
    }

    if (!key.user.isActive) {
      throw new ForbiddenException("User account is not active");
    }

    // Update last used timestamp and usage count
    await this.streamKeyRepository.update(key.id, {
      lastUsedAt: new Date(),
      usageCount: key.usageCount + 1,
    });

    // TODO - Publish stream key used event

    return key;
  }

  async revokeStreamKey(userId: string): Promise<void> {
    const streamKey = await this.streamKeyRepository.findOne({
      where: { userId, isActive: true },
    });

    if (!streamKey) {
      throw new NotFoundException("No active stream key found for user");
    }

    await this.streamKeyRepository.update(streamKey.id, { isActive: false });

    // TODO - Publish stream key revoked event

    // Track metric
    this.metricsService.incrementUserOperation("stream_key_revoked", "success");
  }

  async getStreamKeyHistory(
    userId: string,
    limit: number = 10,
    offset: number = 0,
  ): Promise<{ streamKeys: StreamKey[]; total: number }> {
    const [streamKeys, total] = await this.streamKeyRepository.findAndCount({
      where: { userId },
      order: { createdAt: "DESC" },
      take: limit,
      skip: offset,
    });

    return { streamKeys, total };
  }

  private generateUniqueKey(): string {
    // Generate a secure random key
    const randomBytes = crypto.randomBytes(32);
    const timestamp = Date.now().toString();
    const combined = randomBytes.toString("hex") + timestamp;

    // Create a hash for shorter, URL-safe key
    return crypto
      .createHash("sha256")
      .update(combined)
      .digest("hex")
      .substring(0, 32); // 32 character key
  }
}
