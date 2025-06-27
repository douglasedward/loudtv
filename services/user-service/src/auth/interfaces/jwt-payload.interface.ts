export interface JwtPayload {
  sub: string; // User ID
  username: string;
  email: string;
  isStreamer: boolean;
  iat?: number;
  exp?: number;
}
