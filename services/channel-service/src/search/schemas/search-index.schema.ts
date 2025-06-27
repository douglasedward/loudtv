import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document } from "mongoose";

export type SearchIndexDocument = SearchIndex & Document;

@Schema({
  collection: "search_indexes",
  timestamps: true,
})
export class SearchIndex {
  @Prop({ required: true })
  entityId: string;

  @Prop({ required: true, enum: ["channel", "category", "schedule"] })
  entityType: string;

  @Prop({ required: true })
  title: string;

  @Prop()
  description?: string;

  @Prop([String])
  tags: string[];

  @Prop()
  categoryId?: string;

  @Prop()
  categoryName?: string;

  @Prop({ default: true })
  isActive: boolean;

  @Prop({ default: 0 })
  popularity: number;

  @Prop({ default: Date.now })
  lastIndexed: Date;

  @Prop({ type: Object })
  metadata?: Record<string, any>;
}

export const SearchIndexSchema = SchemaFactory.createForClass(SearchIndex);

// Indexes for efficient searching
SearchIndexSchema.index({ title: "text", description: "text", tags: "text" });
SearchIndexSchema.index({ entityType: 1, isActive: 1 });
SearchIndexSchema.index({ categoryId: 1 });
SearchIndexSchema.index({ popularity: -1 });
SearchIndexSchema.index({ lastIndexed: 1 });
