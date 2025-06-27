import {
  Injectable,
  UnauthorizedException,
  ConflictException,
} from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import * as bcrypt from "bcrypt";

import { User } from "../users/entities/user.entity";
import { RegisterDto, LoginDto, AuthResponseDto } from "./dto/auth.dto";
import { JwtPayload } from "./interfaces/jwt-payload.interface";
import { EventsService } from "../events/events.service";
import { MetricsService } from "../metrics/metrics.service";

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly jwtService: JwtService,
    private readonly eventsService: EventsService,
    private readonly metricsService: MetricsService,
  ) {}

  async register(
    registerDto: RegisterDto,
  ): Promise<{ user: Partial<User>; token: string }> {
    try {
      const { username, email, password, displayName, isStreamer } =
        registerDto;

      // Check if email is already taken
      const existingUserByEmail = await this.userRepository.findOne({
        where: { email },
      });
      if (existingUserByEmail) {
        this.metricsService.incrementAuthOperation("register", "failure");
        throw new ConflictException("Email already registered");
      }

      // Check if username is already taken
      const existingUserByUsername = await this.userRepository.findOne({
        where: { username },
      });
      if (existingUserByUsername) {
        this.metricsService.incrementAuthOperation("register", "failure");
        throw new ConflictException("Username already taken");
      }

      // Hash password
      const saltRounds = 12;
      const passwordHash = await bcrypt.hash(password, saltRounds);

      // Create user
      const user = this.userRepository.create({
        username,
        email,
        passwordHash,
        displayName: displayName || username,
        isStreamer: isStreamer || false,
        isActive: true,
        emailVerified: false,
      });

      const savedUser = await this.userRepository.save(user);

      // Publish user created event
      await this.eventsService.publishUserCreated(savedUser.id, {
        username: savedUser.username,
        email: savedUser.email,
        isStreamer: savedUser.isStreamer,
      });

      // Generate JWT token
      const payload: JwtPayload = {
        sub: savedUser.id,
        username: savedUser.username,
        email: savedUser.email,
        isStreamer: savedUser.isStreamer,
      };

      const token = this.jwtService.sign(payload);

      // Return user without password
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { passwordHash: _, ...userWithoutPassword } = savedUser;

      this.metricsService.incrementAuthOperation("register", "success");

      return {
        user: userWithoutPassword,
        token,
      };
    } catch (error) {
      if (error instanceof ConflictException) {
        throw error;
      }
      this.metricsService.incrementAuthOperation("register", "failure");
      throw error;
    }
  }

  async login(
    loginDto: LoginDto,
  ): Promise<{ user: Partial<User>; token: string }> {
    try {
      const { email, password } = loginDto;

      // Find user
      const user = await this.userRepository.findOne({
        where: { email },
      });

      if (!user) {
        this.metricsService.incrementAuthOperation("login", "failure");
        throw new UnauthorizedException("Invalid credentials");
      }

      if (!user.isActive) {
        this.metricsService.incrementAuthOperation("login", "failure");
        throw new UnauthorizedException("Account is deactivated");
      }

      // Verify password
      const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
      if (!isPasswordValid) {
        this.metricsService.incrementAuthOperation("login", "failure");
        throw new UnauthorizedException("Invalid credentials");
      }

      // Update last login
      await this.userRepository.update(user.id, {
        lastLoginAt: new Date(),
      });

      // Generate JWT token
      const payload: JwtPayload = {
        sub: user.id,
        username: user.username,
        email: user.email,
        isStreamer: user.isStreamer,
      };

      const token = this.jwtService.sign(payload);

      // Return user without password
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { passwordHash: _, ...userWithoutPassword } = user;

      this.metricsService.incrementAuthOperation("login", "success");

      return {
        user: userWithoutPassword,
        token,
      };
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      this.metricsService.incrementAuthOperation("login", "failure");
      throw error;
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  logout(userId: string): Promise<void> {
    // TODO - Invalidate JWT token
    return Promise.resolve();
  }

  async refreshToken(refreshToken: string): Promise<AuthResponseDto> {
    try {
      // Verify refresh token
      const payload = this.jwtService.verify(refreshToken);

      // Get user
      const user = await this.userRepository.findOne({
        where: { id: payload.sub, isActive: true },
      });

      if (!user) {
        throw new UnauthorizedException("Invalid refresh token");
      }

      // Generate new tokens
      const newPayload: JwtPayload = {
        sub: user.id,
        username: user.username,
        email: user.email,
        isStreamer: user.isStreamer,
      };

      const accessToken = this.jwtService.sign(newPayload, {
        expiresIn: "15m",
      });
      const newRefreshToken = this.jwtService.sign(newPayload, {
        expiresIn: "7d",
      });

      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { passwordHash: _, ...userWithoutPassword } = user;

      this.metricsService.incrementAuthOperation("refresh_token", "success");

      return {
        user: userWithoutPassword,
        token: accessToken,
        accessToken,
        refreshToken: newRefreshToken,
      };
    } catch {
      this.metricsService.incrementAuthOperation("refresh_token", "failure");
      throw new UnauthorizedException("Invalid refresh token");
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  forgotPassword(email: string): Promise<void> {
    // TODO - send email with reset link
    console.log("Forgot password");
    return Promise.resolve();
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  resetPassword(token: string, newPassword: string): Promise<void> {
    // TODO - verify token from DB and update password
    console.log("Password reset");
    return Promise.resolve();
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  verifyEmail(token: string): Promise<void> {
    // TODO, verify token from DB and update email verification
    console.log("Email verification");
    return Promise.resolve();
  }

  async validateUser(
    email: string,
    password: string,
  ): Promise<Partial<User> | null> {
    const user = await this.userRepository.findOne({
      where: { email },
    });

    if (user && user.isActive) {
      const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
      if (isPasswordValid) {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { passwordHash: _, ...result } = user;
        return result;
      }
    }
    return null;
  }

  async validateUserById(userId: string): Promise<Partial<User> | null> {
    const user = await this.userRepository.findOne({
      where: { id: userId, isActive: true },
    });

    if (user) {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { passwordHash: _, ...result } = user;
      return result;
    }
    return null;
  }
}
