import { IsUUID } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class FollowUserDto {
  @ApiProperty({
    description: "ID of the user to follow",
    example: "123e4567-e89b-12d3-a456-426614174000",
  })
  @IsUUID()
  userId: string;
}

export class FollowersResponseDto {
  @ApiProperty({
    description: "List of followers",
    type: "array",
  })
  followers: any[];

  @ApiProperty({
    description: "Total number of followers",
    example: 1250,
  })
  total: number;
}

export class FollowingResponseDto {
  @ApiProperty({
    description: "List of users being followed",
    type: "array",
  })
  following: any[];

  @ApiProperty({
    description: "Total number of users being followed",
    example: 75,
  })
  total: number;
}
