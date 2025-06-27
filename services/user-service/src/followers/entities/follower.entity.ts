import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  Index,
} from "typeorm";
import { ApiProperty } from "@nestjs/swagger";
import { User } from "../../users/entities/user.entity";

@Entity("followers")
@Index(["followerId", "followingId"], { unique: true })
@Index(["followerId"])
@Index(["followingId"])
export class Follower {
  @ApiProperty({
    description: "Unique identifier of the follow relationship",
    example: "123e4567-e89b-12d3-a456-426614174000",
  })
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @ApiProperty({
    description: "ID of the user who is following",
    example: "123e4567-e89b-12d3-a456-426614174001",
  })
  @Column({ name: "follower_id" })
  followerId: string;

  @ApiProperty({
    description: "ID of the user being followed",
    example: "123e4567-e89b-12d3-a456-426614174002",
  })
  @Column({ name: "following_id" })
  followingId: string;

  @ApiProperty({
    description: "Date when the follow relationship was created",
    example: "2024-01-01T12:00:00.000Z",
  })
  @CreateDateColumn({ name: "followed_at" })
  followedAt: Date;

  // Relations
  @ManyToOne(() => User, (user) => user.following, { onDelete: "CASCADE" })
  @JoinColumn({ name: "follower_id" })
  follower: User;

  @ManyToOne(() => User, (user) => user.followers, { onDelete: "CASCADE" })
  @JoinColumn({ name: "following_id" })
  following: User;

  constructor(partial: Partial<Follower>) {
    Object.assign(this, partial);
  }
}
