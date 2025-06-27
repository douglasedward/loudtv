import { StreamKeyValidationResponse } from "../interfaces/stream.interface";

/**
 * Type guard to validate if the response matches the expected StreamKeyValidationResponse structure
 */
export function isValidStreamKeyResponse(
  response: unknown,
): response is StreamKeyValidationResponse {
  if (!response || typeof response !== "object") {
    return false;
  }

  const resp = response as Record<string, unknown>;
  const data = resp.data as Record<string, unknown>;
  const user = data?.user as Record<string, unknown>;

  return Boolean(
    resp.data &&
      typeof resp.data === "object" &&
      data.user &&
      typeof data.user === "object" &&
      user?.id &&
      typeof user.id === "string" &&
      user?.username &&
      typeof user.username === "string" &&
      typeof resp.statusCode === "number" &&
      typeof resp.message === "string" &&
      typeof resp.timestamp === "string",
  );
}

/**
 * Validates and parses the API response with proper error handling
 */
export function parseStreamKeyValidationResponse(
  responseData: unknown,
): StreamKeyValidationResponse {
  if (!isValidStreamKeyResponse(responseData)) {
    throw new Error("Invalid response format from User Service");
  }

  return responseData;
}
