import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from "typeorm";
import { User } from "@/users/entities/user.entity";

@Entity("stream_keys")
@Index(["userId"], { unique: true }) // One active stream key per user
export class StreamKey {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column("uuid")
  userId: string;

  @Column({ type: "varchar", length: 255, unique: true })
  streamKey: string;

  @Column({ type: "varchar", length: 255, unique: true })
  streamUrl: string;

  @Column({ type: "boolean", default: true })
  isActive: boolean;

  @Column({ type: "timestamp", nullable: true })
  lastUsedAt: Date;

  @Column({ type: "int", default: 0 })
  usageCount: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne(() => User, (user) => user.streamKeys)
  @JoinColumn({ name: "userId" })
  user: User;
}
