import crypto from "node:crypto";
import jwt from "jsonwebtoken";
import { Role } from "../generated/prisma/client";
import { env } from "../config/env";

export interface AccessTokenPayload {
  sub: string;
  role: Role;
  name: string;
}

export function signAccessToken(payload: AccessTokenPayload): string {
  return jwt.sign(payload, env.jwtAccessSecret, {
    expiresIn: env.accessTokenExpiresIn as jwt.SignOptions["expiresIn"],
  });
}

export function verifyAccessToken(token: string): AccessTokenPayload {
  return jwt.verify(token, env.jwtAccessSecret) as AccessTokenPayload;
}

export function generateRefreshToken(): string {
  return crypto.randomBytes(64).toString("hex");
}

export function hashRefreshToken(rawToken: string): string {
  return crypto
    .createHash("sha256")
    .update(rawToken + env.jwtRefreshPepper)
    .digest("hex");
}

export function refreshTokenExpiryDate(): Date {
  const date = new Date();
  date.setHours(date.getHours() + env.refreshTokenExpiresInHours);
  return date;
}
