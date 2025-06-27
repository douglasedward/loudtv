import { Injectable } from "@nestjs/common";

@Injectable()
export class SecurityService {
  sanitizeInput(input: string): string {
    // Remove potential script tags and dangerous characters
    return input
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
      .replace(/[<>'"]/g, (char) => {
        const htmlEntities: Record<string, string> = {
          "<": "&lt;",
          ">": "&gt;",
          '"': "&quot;",
          "'": "&#x27;",
        };
        return htmlEntities[char] || char;
      });
  }
}
