import { ApiProperty } from "@nestjs/swagger";

export class StreamKeyResponseDto {
  @ApiProperty({
    description: "Stream key ID",
    example: "123e4567-e89b-12d3-a456-426614174000",
  })
  id: string;

  @ApiProperty({
    description: "User ID",
    example: "123e4567-e89b-12d3-a456-426614174000",
  })
  userId: string;

  @ApiProperty({
    description: "Stream key for authentication",
    example: "sk_1234567890abcdef1234567890abcdef",
  })
  streamKey: string;

  @ApiProperty({
    description: "RTMP stream URL",
    example: "rtmp://localhost:1935/live/sk_1234567890abcdef1234567890abcdef",
  })
  streamUrl: string;

  @ApiProperty({
    description: "Whether the stream key is active",
    example: true,
  })
  isActive: boolean;

  @ApiProperty({
    description: "Last time the stream key was used",
    example: "2024-01-15T10:30:00Z",
    nullable: true,
  })
  lastUsedAt: Date;

  @ApiProperty({
    description: "Number of times the stream key has been used",
    example: 5,
  })
  usageCount: number;

  @ApiProperty({
    description: "Stream key creation timestamp",
    example: "2024-01-15T10:00:00Z",
  })
  createdAt: Date;

  @ApiProperty({
    description: "Stream key last update timestamp",
    example: "2024-01-15T10:30:00Z",
  })
  updatedAt: Date;
}

export class StreamKeyHistoryResponseDto {
  @ApiProperty({
    type: [StreamKeyResponseDto],
    description: "List of stream keys",
  })
  streamKeys: StreamKeyResponseDto[];

  @ApiProperty({
    description: "Total number of stream keys",
    example: 25,
  })
  total: number;
}
