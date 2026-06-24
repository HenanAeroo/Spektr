import { z } from "zod";

/**
 * Single source of truth for the new-password policy on the client.
 * Must stay aligned with the backend DTOs (LocalRegisterDto / ResetPasswordDto /
 * ChangePasswordDto): minimum 12 characters with at least 1 uppercase letter,
 * 1 digit and 1 special character.
 */
export const PASSWORD_MIN_LENGTH = 12;

// 1 uppercase, 1 digit, 1 special char (mirrors the backend @Matches regex).
export const PASSWORD_COMPLEXITY = /^(?=.*[A-Z])(?=.*[0-9])(?=.*[^A-Za-z0-9])/;

export const PASSWORD_POLICY_MESSAGE =
  "12 caractères minimum, avec au moins 1 majuscule, 1 chiffre et 1 caractère spécial";

export function isStrongPassword(password: string): boolean {
  return (
    password.length >= PASSWORD_MIN_LENGTH && PASSWORD_COMPLEXITY.test(password)
  );
}

export const passwordSchema = z
  .string()
  .min(PASSWORD_MIN_LENGTH, PASSWORD_POLICY_MESSAGE)
  .regex(PASSWORD_COMPLEXITY, PASSWORD_POLICY_MESSAGE);
