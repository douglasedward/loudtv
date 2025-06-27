import { Injectable, Logger, HttpException, HttpStatus } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { UserValidationResponse } from "../interfaces/stream.interface";
import { parseStreamKeyValidationResponse } from "../utils/api-response-validator";

@Injectable()
export class UserService {
  private readonly logger = new Logger(UserService.name);
  private readonly baseUrl: string;
  private readonly timeout: number;

  constructor(private readonly configService: ConfigService) {
    this.baseUrl =
      this.configService.get<string>("USER_SERVICE_URL") ||
      "http://localhost:3001";
    this.timeout =
      Number(this.configService.get<number>("USER_SERVICE_TIMEOUT")) || 5000;
  }

  async validateStreamKey(streamKey: string): Promise<UserValidationResponse> {
    try {
      const response = await fetch(
        `${this.baseUrl}/api/v1/stream-keys/validate/${streamKey}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${this.configService.get<string>("USER_SERVICE_API_KEY")}`,
          },
          signal: AbortSignal.timeout(this.timeout),
        },
      );

      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          return {
            valid: false,
            message: "Invalid stream key",
          };
        }

        throw new HttpException(
          `User service returned status ${response.status}`,
          HttpStatus.SERVICE_UNAVAILABLE,
        );
      }

      const responseData: unknown = await response.json();
      const apiResponse = parseStreamKeyValidationResponse(responseData);

      return {
        valid: true,
        userId: apiResponse.data.user.id,
        username: apiResponse.data.user.username,
      };
    } catch (error) {
      if (error instanceof TypeError) {
        this.logger.error("Failed to connect to User Service:", error.message);
        throw new HttpException(
          "User Service unavailable",
          HttpStatus.SERVICE_UNAVAILABLE,
        );
      }

      if (error instanceof Error && error.name === "TimeoutError") {
        this.logger.error("User Service request timeout");
        throw new HttpException(
          "User Service timeout",
          HttpStatus.REQUEST_TIMEOUT,
        );
      }

      this.logger.error("User validation error:", error);
      throw error;
    }
  }

  async isHealthy(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/health`, {
        method: "GET",
        signal: AbortSignal.timeout(this.timeout),
      });

      return response.ok;
    } catch (error) {
      this.logger.error("User Service health check failed:", error);
      return false;
    }
  }
}
