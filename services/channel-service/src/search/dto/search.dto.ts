import {
  IsString,
  IsOptional,
  IsNumber,
  IsArray,
  IsEnum,
  Min,
  Max,
} from "class-validator";
import { Type } from "class-transformer";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

export class SearchQueryDto {
  @ApiProperty({ description: "Search query string" })
  @IsString()
  query: string;

  @ApiPropertyOptional({
    description: "Entity type to search",
    enum: ["channel", "category", "schedule"],
  })
  @IsOptional()
  @IsEnum(["channel", "category", "schedule"])
  type?: string;

  @ApiPropertyOptional({ description: "Category ID to filter by" })
  @IsOptional()
  @IsString()
  categoryId?: string;

  @ApiPropertyOptional({ description: "Tags to filter by" })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @ApiPropertyOptional({
    description: "Number of results per page",
    minimum: 1,
    maximum: 100,
    default: 20,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number = 20;

  @ApiPropertyOptional({ description: "Page offset", minimum: 0, default: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  offset?: number = 0;

  @ApiPropertyOptional({
    description: "Sort by field",
    enum: ["relevance", "popularity", "created", "updated"],
  })
  @IsOptional()
  @IsEnum(["relevance", "popularity", "created", "updated"])
  sortBy?: string = "relevance";

  @ApiPropertyOptional({ description: "Sort order", enum: ["asc", "desc"] })
  @IsOptional()
  @IsEnum(["asc", "desc"])
  sortOrder?: string = "desc";
}

export class SearchSuggestionDto {
  @ApiProperty({ description: "Partial query for suggestions" })
  @IsString()
  query: string;

  @ApiPropertyOptional({
    description: "Entity type for suggestions",
    enum: ["channel", "category", "schedule"],
  })
  @IsOptional()
  @IsEnum(["channel", "category", "schedule"])
  type?: string;

  @ApiPropertyOptional({
    description: "Maximum number of suggestions",
    minimum: 1,
    maximum: 20,
    default: 10,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(20)
  limit?: number = 10;
}

export class IndexEntityDto {
  @ApiProperty({ description: "Entity ID" })
  @IsString()
  entityId: string;

  @ApiProperty({
    description: "Entity type",
    enum: ["channel", "category", "schedule"],
  })
  @IsEnum(["channel", "category", "schedule"])
  entityType: string;

  @ApiProperty({ description: "Entity title" })
  @IsString()
  title: string;

  @ApiPropertyOptional({ description: "Entity description" })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: "Entity tags" })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @ApiPropertyOptional({ description: "Category ID" })
  @IsOptional()
  @IsString()
  categoryId?: string;

  @ApiPropertyOptional({ description: "Category name" })
  @IsOptional()
  @IsString()
  categoryName?: string;

  @ApiPropertyOptional({ description: "Popularity score" })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  popularity?: number;

  @ApiPropertyOptional({ description: "Additional metadata" })
  @IsOptional()
  metadata?: Record<string, any>;
}
