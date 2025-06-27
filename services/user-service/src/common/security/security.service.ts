import { Injectable } from "@nestjs/common";
import * as crypto from "crypto";

export interface PasswordPolicy {
  minLength: number;
  requireUppercase: boolean;
  requireLowercase: boolean;
  requireNumbers: boolean;
  requireSpecialChars: boolean;
  preventCommonPasswords: boolean;
  preventUserDataInPassword: boolean;
}

interface ValidatePasswordResult {
  valid: boolean;
  errors: string[];
  score: number;
}

@Injectable()
export class SecurityService {
  private readonly commonPasswords = new Set([
    "password",
    "123456",
    "123456789",
    "qwerty",
    "abc123",
    "password123",
    "admin",
    "letmein",
    "welcome",
    "monkey",
    "dragon",
    "master",
    "hello",
    "login",
    "passw0rd",
  ]);

  private readonly passwordPolicy: PasswordPolicy = {
    minLength: 8,
    requireUppercase: true,
    requireLowercase: true,
    requireNumbers: true,
    requireSpecialChars: true,
    preventCommonPasswords: true,
    preventUserDataInPassword: true,
  };

  /**
   * Validate password strength
   */
  validatePassword(
    password: string,
    userData?: { username?: string; email?: string },
  ): ValidatePasswordResult {
    const errors: string[] = [];
    let score = 0;

    // Check minimum length
    if (password.length < this.passwordPolicy.minLength) {
      errors.push(
        `Password must be at least ${this.passwordPolicy.minLength} characters long`,
      );
    } else {
      score += 10;
    }

    // Check for uppercase letters
    if (this.passwordPolicy.requireUppercase && !/[A-Z]/.test(password)) {
      errors.push("Password must contain at least one uppercase letter");
    } else if (/[A-Z]/.test(password)) {
      score += 10;
    }

    // Check for lowercase letters
    if (this.passwordPolicy.requireLowercase && !/[a-z]/.test(password)) {
      errors.push("Password must contain at least one lowercase letter");
    } else if (/[a-z]/.test(password)) {
      score += 10;
    }

    // Check for numbers
    if (this.passwordPolicy.requireNumbers && !/\d/.test(password)) {
      errors.push("Password must contain at least one number");
    } else if (/\d/.test(password)) {
      score += 10;
    }

    // Check for special characters
    if (
      this.passwordPolicy.requireSpecialChars &&
      !/[!@#$%^&*(),.?":{}|<>]/.test(password)
    ) {
      errors.push("Password must contain at least one special character");
    } else if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      score += 10;
    }

    // Check against common passwords
    if (
      this.passwordPolicy.preventCommonPasswords &&
      this.commonPasswords.has(password.toLowerCase())
    ) {
      errors.push("Password is too common");
      score -= 20;
    }

    // Check for user data in password
    if (this.passwordPolicy.preventUserDataInPassword && userData) {
      const lowerCasedPassword = password.toLowerCase();
      if (
        userData.username &&
        lowerCasedPassword.includes(userData.username.toLowerCase())
      ) {
        errors.push("Password cannot contain your username");
        score -= 10;
      }
      if (userData.email) {
        const emailParts = userData.email.toLowerCase().split("@");
        if (emailParts[0] && lowerCasedPassword.includes(emailParts[0])) {
          errors.push("Password cannot contain your email");
          score -= 10;
        }
      }
    }

    // Bonus points for length
    if (password.length >= 12) score += 10;
    if (password.length >= 16) score += 10;

    // Bonus points for complexity
    const uniqueChars = new Set(password).size;
    if (uniqueChars >= password.length * 0.7) score += 10;

    score = Math.max(0, Math.min(100, score));

    return {
      valid: errors.length === 0,
      errors,
      score,
    };
  }

  /**
   * Generate secure token
   */
  generateSecureToken(length: number = 32): string {
    return crypto.randomBytes(length).toString("hex");
  }

  /**
   * Hash sensitive data for audit logs
   */
  hashSensitiveData(data: string): string {
    return crypto
      .createHash("sha256")
      .update(data)
      .digest("hex")
      .substring(0, 8);
  }
}
