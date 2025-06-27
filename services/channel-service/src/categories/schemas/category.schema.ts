import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document } from "mongoose";

export type CategoryDocument = Category & Document;

@Schema({
  timestamps: true,
  toJSON: {
    transform: (doc, ret) => {
      ret.id = ret._id;
      delete ret._id;
      delete ret.__v;
      return ret;
    },
  },
})
export class Category {
  @Prop({ required: true, unique: true, maxlength: 50 })
  name: string;

  @Prop({ required: true, unique: true, maxlength: 60 })
  slug: string;

  @Prop({ maxlength: 200 })
  description?: string;

  @Prop()
  thumbnailUrl?: string;

  @Prop({ default: 0, min: 0 })
  channelCount: number;

  @Prop({ default: true })
  isActive: boolean;

  @Prop({ default: 0 })
  sortOrder: number;

  @Prop({ default: Date.now })
  createdAt: Date;

  @Prop({ default: Date.now })
  updatedAt: Date;
}

export const CategorySchema = SchemaFactory.createForClass(Category);

// Indexes
CategorySchema.index({ slug: 1 });
CategorySchema.index({ isActive: 1, sortOrder: 1 });
CategorySchema.index({ channelCount: -1 });
