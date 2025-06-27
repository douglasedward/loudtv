import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document } from "mongoose";

export type ChannelDocument = Channel & Document;

@Schema()
export class StreamSettings {
  @Prop({ default: "720p" })
  quality: string;

  @Prop({ default: 2500 })
  bitrate: number;

  @Prop({ default: 30 })
  fps: number;

  @Prop({ default: true })
  enableChat: boolean;

  @Prop({ default: "everyone", enum: ["everyone", "followers", "subscribers"] })
  chatMode: string;

  @Prop({ default: true })
  enableDonations: boolean;

  @Prop({ default: false })
  matureContent: boolean;
}

@Schema()
export class CurrentStream {
  @Prop({ default: false })
  isLive: boolean;

  @Prop()
  streamId?: string;

  @Prop()
  title?: string;

  @Prop({ default: 0 })
  viewerCount: number;

  @Prop({ default: 0 })
  peakViewers: number;

  @Prop()
  startedAt?: Date;

  @Prop()
  endedAt?: Date;
}

@Schema()
export class ChannelStats {
  @Prop({ default: 0 })
  totalViews: number;

  @Prop({ default: 0 })
  totalStreams: number;

  @Prop({ default: 0 })
  followersCount: number;

  @Prop({ default: 0 })
  averageViewers: number;

  @Prop({ default: 0 })
  totalWatchTime: number;
}

@Schema()
export class ModerationInfo {
  @Prop({
    default: "active",
    enum: ["active", "warned", "suspended", "banned"],
  })
  status: string;

  @Prop({ default: 0 })
  reports: number;

  @Prop()
  lastReportAt?: Date;

  @Prop()
  moderationNotes?: string;
}

@Schema({
  timestamps: true,
  toJSON: {
    transform: (_doc, ret) => {
      ret.id = ret._id;
      delete ret._id;
      delete ret.__v;
      return ret;
    },
  },
})
export class Channel {
  @Prop({})
  userId?: string;

  @Prop({ required: true })
  username: string;

  @Prop({ required: true, maxlength: 100 })
  title: string;

  @Prop({ maxlength: 500 })
  description?: string;

  @Prop({ required: true })
  category: string;

  @Prop({ type: [String], default: [] })
  tags: string[];

  @Prop({ default: "en" })
  language: string;

  @Prop()
  thumbnailUrl?: string;

  @Prop()
  bannerUrl?: string;

  @Prop({ type: StreamSettings, default: () => ({}) })
  streamSettings: StreamSettings;

  @Prop({ type: CurrentStream, default: () => ({}) })
  currentStream: CurrentStream;

  @Prop({ type: ChannelStats, default: () => ({}) })
  stats: ChannelStats;

  @Prop({ type: ModerationInfo, default: () => ({}) })
  moderation: ModerationInfo;

  @Prop()
  lastStreamAt?: Date;

  @Prop({ default: Date.now })
  createdAt: Date;

  @Prop({ default: Date.now })
  updatedAt: Date;
}

export const ChannelSchema = SchemaFactory.createForClass(Channel);

// Indexes
ChannelSchema.index({ username: 1 });
ChannelSchema.index({ category: 1 });
ChannelSchema.index({ "currentStream.isLive": 1 });
ChannelSchema.index({ "stats.followersCount": -1 });
ChannelSchema.index({ "stats.totalViews": -1 });
ChannelSchema.index({ createdAt: -1 });
ChannelSchema.index({ lastStreamAt: -1 });

// Compound indexes
ChannelSchema.index({
  category: 1,
  "currentStream.isLive": -1,
  "stats.totalViews": -1,
});
ChannelSchema.index({
  "currentStream.isLive": -1,
  "currentStream.viewerCount": -1,
});
