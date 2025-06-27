import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";

import { Follower } from "./entities/follower.entity";
import { User } from "../users/entities/user.entity";
import { EventsService } from "../events/events.service";
import { MetricsService } from "../metrics/metrics.service";

@Injectable()
export class FollowersService {
  constructor(
    @InjectRepository(Follower)
    private readonly followerRepository: Repository<Follower>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly eventsService: EventsService,
    private readonly metricsService: MetricsService,
  ) {}

  async followUser(followerId: string, followingId: string): Promise<Follower> {
    // Prevent users from following themselves
    if (followerId === followingId) {
      throw new BadRequestException("Cannot follow yourself");
    }

    // Check if both users exist
    const [follower, following] = await Promise.all([
      this.userRepository.findOne({
        where: { id: followerId, isActive: true },
      }),
      this.userRepository.findOne({
        where: { id: followingId, isActive: true },
      }),
    ]);

    if (!follower) {
      throw new NotFoundException("Follower user not found");
    }

    if (!following) {
      throw new NotFoundException("User to follow not found");
    }

    // Check if already following
    const existingFollow = await this.followerRepository.findOne({
      where: { followerId, followingId },
    });

    if (existingFollow) {
      throw new ConflictException("Already following this user");
    }

    // Create follow relationship
    const followRelation = this.followerRepository.create({
      followerId,
      followingId,
    });

    await this.followerRepository.save(followRelation);

    // Publish follow event
    await this.eventsService.publishUserFollowed(followerId, followingId);

    // Track successful follow
    this.metricsService.incrementFollowOperation("follow");

    return followRelation;
  }

  async unfollowUser(followerId: string, followingId: string): Promise<void> {
    const followRelation = await this.followerRepository.findOne({
      where: { followerId, followingId },
    });

    if (!followRelation) {
      throw new NotFoundException("Follow relationship not found");
    }

    await this.followerRepository.remove(followRelation);

    // Publish unfollow event
    await this.eventsService.publishUserUnfollowed(followerId, followingId);

    // Track successful unfollow
    this.metricsService.incrementFollowOperation("unfollow");
  }

  async getFollowers(
    userId: string,
    limit: number = 20,
    offset: number = 0,
  ): Promise<{ followers: User[]; total: number }> {
    const user = await this.userRepository.findOne({
      where: { id: userId, isActive: true },
    });

    if (!user) {
      throw new NotFoundException("User not found");
    }

    const [followers, total] = await this.followerRepository
      .createQueryBuilder("follower")
      .leftJoinAndSelect("follower.follower", "user")
      .where("follower.followingId = :userId", { userId })
      .andWhere("user.isActive = :isActive", { isActive: true })
      .orderBy("follower.followedAt", "DESC")
      .limit(limit)
      .offset(offset)
      .getManyAndCount();

    return {
      followers: followers.map((f) => f.follower),
      total,
    };
  }

  async getFollowing(
    userId: string,
    limit: number = 20,
    offset: number = 0,
  ): Promise<{ following: User[]; total: number }> {
    const user = await this.userRepository.findOne({
      where: { id: userId, isActive: true },
    });

    if (!user) {
      throw new NotFoundException("User not found");
    }

    const [following, total] = await this.followerRepository
      .createQueryBuilder("follower")
      .leftJoinAndSelect("follower.following", "user")
      .where("follower.followerId = :userId", { userId })
      .andWhere("user.isActive = :isActive", { isActive: true })
      .orderBy("follower.followedAt", "DESC")
      .limit(limit)
      .offset(offset)
      .getManyAndCount();

    return {
      following: following.map((f) => f.following),
      total,
    };
  }

  async isFollowing(followerId: string, followingId: string): Promise<boolean> {
    const followRelation = await this.followerRepository.findOne({
      where: { followerId, followingId },
    });

    return !!followRelation;
  }

  async getFollowersCount(userId: string): Promise<number> {
    return this.followerRepository.count({
      where: { followingId: userId },
    });
  }

  async getFollowingCount(userId: string): Promise<number> {
    return this.followerRepository.count({
      where: { followerId: userId },
    });
  }
}
