import { ApiProperty } from "@nestjs/swagger";
import { IsString, IsNotEmpty, IsOptional, IsEnum } from "class-validator";

export enum StreamProtocol {
  RTMP = "rtmp",
  WEBRTC = "webrtc",
}

export class StartStreamDto {
  @ApiProperty({
    description: "Stream key for authentication",
    example: "live_123456789abcdef",
  })
  @IsString()
  @IsNotEmpty()
  streamKey: string;

  @ApiProperty({
    description: "Stream protocol",
    enum: StreamProtocol,
    example: StreamProtocol.RTMP,
  })
  @IsEnum(StreamProtocol)
  protocol: StreamProtocol;

  @ApiProperty({
    description: "Stream title",
    example: "My Awesome Stream",
    required: false,
  })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiProperty({
    description: "Stream description",
    example: "Playing my favorite game!",
    required: false,
  })
  @IsOptional()
  @IsString()
  description?: string;
}

export class StreamStatusDto {
  @ApiProperty({
    description: "Stream identifier",
    example: "stream_123456789",
  })
  streamId: string;

  @ApiProperty({
    description: "Stream key",
    example: "live_123456789abcdef",
  })
  streamKey: string;

  @ApiProperty({
    description: "Stream protocol",
    enum: StreamProtocol,
  })
  protocol: StreamProtocol;

  @ApiProperty({
    description: "Stream status",
    example: "active",
  })
  status: string;

  @ApiProperty({
    description: "User ID",
    example: "user_123",
  })
  userId: string;

  @ApiProperty({
    description: "Stream start time",
    example: "2024-01-15T10:30:00Z",
  })
  startedAt: Date;

  @ApiProperty({
    description: "Stream bitrate in kbps",
    example: 2500,
  })
  bitrate?: number;

  @ApiProperty({
    description: "Stream resolution",
    example: "1920x1080",
  })
  resolution?: string;

  @ApiProperty({
    description: "Stream FPS",
    example: 30,
  })
  fps?: number;
}
