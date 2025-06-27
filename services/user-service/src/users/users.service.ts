import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import * as bcrypt from "bcrypt";
import { User } from "./entities/user.entity";
import {
  UpdateUserDto,
  UserProfileDto,
  UserPrivacySettingsDto,
  UserNotificationSettingsDto,
} from "./dto/user.dto";
import { EventsService } from "@/events/events.service";
import { CacheService } from "@/common/cache/cache.service";
import { MetricsService } from "@/metrics/metrics.service";
import { SecurityService } from "@/common/security/security.service";
import {
  DatabasePerformanceService,
  PaginatedResult,
  PaginationOptions,
} from "@/common/performance/database-performance.service";

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly eventsService: EventsService,
    private readonly cacheService: CacheService,
    private readonly metricsService: MetricsService,
    private readonly securityService: SecurityService,
    private readonly performanceService: DatabasePerformanceService,
  ) {}

  async findById(id: string): Promise<User> {
    // Try cache first
    const cachedUser = await this.cacheService.getUserProfile(id);
    if (cachedUser) {
      this.metricsService.incrementUserOperation(
        "get_user_cache_hit",
        "success",
      );
      return cachedUser;
    }

    const user = await this.userRepository.findOne({
      where: { id },
      relations: ["followers", "following"],
    });

    if (!user) {
      this.metricsService.incrementUserOperation("get_user", "failure");
      throw new NotFoundException("User not found");
    }

    // Cache the user profile
    await this.cacheService.setUserProfile(id, user);
    this.metricsService.incrementUserOperation("get_user", "success");

    return user;
  }

  async findByUsername(username: string): Promise<User> {
    // Try cache first
    const cachedUser = await this.cacheService.getUser(username);
    if (cachedUser) {
      return cachedUser;
    }

    const user = await this.userRepository.findOne({
      where: { username },
      relations: ["followers", "following"],
    });

    if (!user) {
      throw new NotFoundException("User not found");
    }

    // Cache the user
    await this.cacheService.setUser(username, user);

    return user;
  }

  async findByEmail(email: string): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { email },
    });

    if (!user) {
      throw new NotFoundException("User not found");
    }

    return user;
  }

  async getUserProfile(id: string): Promise<UserProfileDto> {
    const user = await this.findById(id);

    // Count followers and following
    const followersCount = await this.userRepository
      .createQueryBuilder("user")
      .leftJoin("user.followers", "follower")
      .where("user.id = :id", { id })
      .getCount();

    const followingCount = await this.userRepository
      .createQueryBuilder("user")
      .leftJoin("user.following", "following")
      .where("user.id = :id", { id })
      .getCount();

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { passwordHash, ...profileData } = user;

    return {
      ...profileData,
      followersCount,
      followingCount,
    };
  }

  async updateProfile(
    id: string,
    updateUserDto: UpdateUserDto,
  ): Promise<UserProfileDto> {
    const user = await this.findById(id);

    // Check if username is already taken by another user
    if (updateUserDto.username && updateUserDto.username !== user.username) {
      const existingUser = await this.userRepository.findOne({
        where: { username: updateUserDto.username },
      });

      if (existingUser) {
        throw new ConflictException("Username already taken");
      }
    }

    // Update user
    Object.assign(user, updateUserDto);
    await this.userRepository.save(user);

    // Invalidate cache
    await this.cacheService.invalidateUserProfile(id);
    await this.cacheService.invalidateUser(user.username);
    await this.cacheService.invalidateUser(user.email);

    // Publish user updated event
    await this.eventsService.publishUserUpdated(id, updateUserDto);

    // Track metric
    this.metricsService.incrementUserOperation("update_profile", "success");

    return this.getUserProfile(id);
  }

  async deactivateUser(id: string): Promise<void> {
    const user = await this.findById(id);
    user.isActive = false;
    await this.userRepository.save(user);
  }

  async activateUser(id: string): Promise<void> {
    const user = await this.findById(id);
    user.isActive = true;
    await this.userRepository.save(user);
  }

  async verifyEmail(id: string): Promise<void> {
    const user = await this.findById(id);
    user.emailVerified = true;
    await this.userRepository.save(user);
  }

  /**
   * Change user password with security validation
   */
  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string,
  ): Promise<void> {
    const user = await this.findById(userId);

    // Verify current password
    const isCurrentPasswordValid = await bcrypt.compare(
      currentPassword,
      user.passwordHash,
    );
    if (!isCurrentPasswordValid) {
      throw new BadRequestException("Current password is invalid");
    }

    // Validate new password
    const passwordValidation = this.securityService.validatePassword(
      newPassword,
      {
        username: user.username,
        email: user.email,
      },
    );

    if (!passwordValidation.valid) {
      throw new BadRequestException(
        `Password validation failed: ${passwordValidation.errors.join(", ")}`,
      );
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 12);

    // Update password
    await this.userRepository.update(userId, { passwordHash: hashedPassword });

    // Clear user cache
    await this.cacheService.invalidateUserProfile(userId);

    this.metricsService.incrementUserOperation("password_change", "success");
  }

  /**
   * Search users with pagination and performance optimization
   */
  async searchUsers(
    query: string,
    options: PaginationOptions,
  ): Promise<PaginatedResult<User>> {
    const queryBuilder = this.userRepository
      .createQueryBuilder("user")
      .where("user.isActive = :isActive", { isActive: true })
      .andWhere(
        "(user.username ILIKE :query OR user.displayName ILIKE :query)",
        { query: `%${query}%` },
      );

    // Apply performance optimizations
    this.performanceService.optimizeQuery(
      queryBuilder,
      [], // No relations needed for search
      ["id", "username", "displayName", "avatarUrl", "isVerified"],
    );

    const result = await this.performanceService.applyCursorPagination(
      queryBuilder,
      options,
      "username",
    );

    this.metricsService.incrementUserOperation("search_users", "success");
    return result;
  }

  /**
   * Delete user account
   */
  async deleteUserAccount(userId: string): Promise<void> {
    // Delete user data
    await this.userRepository.delete(userId);

    // Clear all caches related to this user
    await this.cacheService.invalidateUserProfile(userId);
    await this.cacheService.invalidateFollowersCache(userId);

    this.metricsService.incrementUserOperation("account_deletion", "success");
  }

  /**
   * Get user privacy settings
   */
  async getPrivacySettings(userId: string): Promise<UserPrivacySettingsDto> {
    const user = await this.findById(userId);

    const settings: UserPrivacySettingsDto = {
      isPublicProfile: user.isPublicProfile,
      showEmail: user.showEmail,
      allowFollowerMessages: user.allowFollowerMessages,
      showActivityStatus: user.showActivityStatus,
    };

    this.metricsService.incrementUserOperation(
      "get_privacy_settings",
      "success",
    );
    return settings;
  }

  /**
   * Update user privacy settings
   */
  async updatePrivacySettings(
    userId: string,
    settings: UserPrivacySettingsDto,
  ): Promise<void> {
    const updateData: Partial<User> = {};

    if (settings.isPublicProfile !== undefined) {
      updateData.isPublicProfile = settings.isPublicProfile;
    }
    if (settings.showEmail !== undefined) {
      updateData.showEmail = settings.showEmail;
    }
    if (settings.allowFollowerMessages !== undefined) {
      updateData.allowFollowerMessages = settings.allowFollowerMessages;
    }
    if (settings.showActivityStatus !== undefined) {
      updateData.showActivityStatus = settings.showActivityStatus;
    }

    // Update user
    await this.userRepository.update(userId, updateData);

    // Clear cache
    await this.cacheService.invalidateUserProfile(userId);

    this.metricsService.incrementUserOperation(
      "update_privacy_settings",
      "success",
    );
  }

  /**
   * Get user notification settings
   */
  async getNotificationSettings(
    userId: string,
  ): Promise<UserNotificationSettingsDto> {
    const user = await this.findById(userId);

    const settings: UserNotificationSettingsDto = {
      emailOnNewFollower: user.emailOnNewFollower,
      emailOnStreamEvents: user.emailOnStreamEvents,
      pushOnNewFollower: user.pushOnNewFollower,
      pushOnStreamEvents: user.pushOnStreamEvents,
    };

    this.metricsService.incrementUserOperation(
      "get_notification_settings",
      "success",
    );
    return settings;
  }

  /**
   * Update user notification settings
   */
  async updateNotificationSettings(
    userId: string,
    settings: UserNotificationSettingsDto,
  ): Promise<void> {
    const updateData: Partial<User> = {};

    if (settings.emailOnNewFollower !== undefined) {
      updateData.emailOnNewFollower = settings.emailOnNewFollower;
    }
    if (settings.emailOnStreamEvents !== undefined) {
      updateData.emailOnStreamEvents = settings.emailOnStreamEvents;
    }
    if (settings.pushOnNewFollower !== undefined) {
      updateData.pushOnNewFollower = settings.pushOnNewFollower;
    }
    if (settings.pushOnStreamEvents !== undefined) {
      updateData.pushOnStreamEvents = settings.pushOnStreamEvents;
    }

    // Update user
    await this.userRepository.update(userId, updateData);

    // Clear cache
    await this.cacheService.invalidateUserProfile(userId);

    this.metricsService.incrementUserOperation(
      "update_notification_settings",
      "success",
    );
  }

  /**
   * Get list of streamers
   */
  async getStreamers(limit: number = 20, offset: number = 0): Promise<User[]> {
    const streamers = await this.userRepository.find({
      where: {
        isStreamer: true,
        isActive: true,
        isPublicProfile: true,
      },
      take: limit,
      skip: offset,
      order: { followersCount: "DESC" },
      select: [
        "id",
        "username",
        "displayName",
        "bio",
        "avatarUrl",
        "followersCount",
        "isVerified",
        "createdAt",
      ],
    });

    this.metricsService.incrementUserOperation("get_streamers", "success");
    return streamers;
  }

  /**
   * Bulk create users
   */
  async bulkCreateUsers(users: Partial<User>[]): Promise<void> {
    // Use repository insert for bulk operations
    await this.userRepository.insert(users);
    this.metricsService.incrementUserOperation("bulk_create", "success");
  }

  /**
   * Get paginated users list
   */
  async getPaginatedUsers(
    options: PaginationOptions,
  ): Promise<PaginatedResult<User>> {
    const queryBuilder = this.userRepository
      .createQueryBuilder("user")
      .where("user.isActive = :isActive", { isActive: true });

    const result = await this.performanceService.applyOffsetPagination(
      queryBuilder,
      options,
    );

    this.metricsService.incrementUserOperation(
      "get_paginated_users",
      "success",
    );
    return result;
  }
}
