import {
  IsString,
  IsOptional,
  IsBoolean,
  IsNumber,
  IsArray,
  IsEnum,
  MaxLength,
  MinLength,
  Min,
  Max,
  IsDate,
} from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

export class CreateChannelDto {
  @ApiProperty({ description: "Channel title", maxLength: 100 })
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  title: string;

  @ApiPropertyOptional({ description: "Channel description", maxLength: 500 })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @ApiProperty({ description: "Channel category" })
  @IsString()
  @MinLength(1)
  category: string;

  @ApiPropertyOptional({ description: "Channel tags", type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @ApiPropertyOptional({ description: "Channel language", default: "en" })
  @IsOptional()
  @IsString()
  language?: string;

  @ApiPropertyOptional({ description: "Thumbnail URL" })
  @IsOptional()
  @IsString()
  thumbnailUrl?: string;

  @ApiPropertyOptional({ description: "Banner URL" })
  @IsOptional()
  @IsString()
  bannerUrl?: string;
}

export class UpdateChannelDto {
  @ApiPropertyOptional({ description: "Channel title", maxLength: 100 })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  title?: string;

  @ApiPropertyOptional({ description: "Channel description", maxLength: 500 })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @ApiPropertyOptional({ description: "Channel category" })
  @IsOptional()
  @IsString()
  @MinLength(1)
  category?: string;

  @ApiPropertyOptional({ description: "Channel tags", type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @ApiPropertyOptional({ description: "Channel language" })
  @IsOptional()
  @IsString()
  language?: string;

  @ApiPropertyOptional({ description: "Thumbnail URL" })
  @IsOptional()
  @IsString()
  thumbnailUrl?: string;

  @ApiPropertyOptional({ description: "Banner URL" })
  @IsOptional()
  @IsString()
  bannerUrl?: string;
}

export class UpdateStreamSettingsDto {
  @ApiPropertyOptional({
    description: "Stream quality",
    enum: ["240p", "360p", "480p", "720p", "1080p"],
  })
  @IsOptional()
  @IsEnum(["240p", "360p", "480p", "720p", "1080p"])
  quality?: string;

  @ApiPropertyOptional({
    description: "Stream bitrate",
    minimum: 500,
    maximum: 8000,
  })
  @IsOptional()
  @IsNumber()
  @Min(500)
  @Max(8000)
  bitrate?: number;

  @ApiPropertyOptional({ description: "Stream FPS", enum: [24, 30, 60] })
  @IsOptional()
  @IsEnum([24, 30, 60])
  fps?: number;

  @ApiPropertyOptional({ description: "Enable chat" })
  @IsOptional()
  @IsBoolean()
  enableChat?: boolean;

  @ApiPropertyOptional({
    description: "Chat mode",
    enum: ["everyone", "followers", "subscribers"],
  })
  @IsOptional()
  @IsEnum(["everyone", "followers", "subscribers"])
  chatMode?: string;

  @ApiPropertyOptional({ description: "Enable donations" })
  @IsOptional()
  @IsBoolean()
  enableDonations?: boolean;

  @ApiPropertyOptional({ description: "Mature content flag" })
  @IsOptional()
  @IsBoolean()
  matureContent?: boolean;
}

export class StartStreamDto {
  @ApiProperty({ description: "Bitrate" })
  @IsNumber()
  bitrate: number;

  @ApiProperty({ description: "Resolution" })
  @IsString()
  resolution: string;

  @ApiProperty({ description: "Frames per second" })
  @IsNumber()
  fps: number;

  @ApiProperty({ description: "Stream codec" })
  @IsString()
  codec: string;

  @ApiProperty({ description: "Stream started at" })
  @IsDate()
  startedAt: Date;
}

export class EndStreamDto {
  @ApiProperty({ description: "Stream duration" })
  @IsNumber()
  duration: number;

  @ApiProperty({ description: "Stream ended at" })
  @IsDate()
  endedAt: Date;
}

export class UpdateStreamInfoDto {
  @ApiPropertyOptional({ description: "Stream title" })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  title?: string;

  @ApiPropertyOptional({ description: "Stream category" })
  @IsOptional()
  @IsString()
  category?: string;
}
