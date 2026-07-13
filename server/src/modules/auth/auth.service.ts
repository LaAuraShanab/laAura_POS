import bcrypt from "bcrypt";
import { Request } from "express";
import { prisma } from "../../lib/prisma";
import { UnauthorizedError } from "../../errors/AppError";
import { recordAudit } from "../../middleware/auditLog";
import {
  generateRefreshToken,
  hashRefreshToken,
  refreshTokenExpiryDate,
  signAccessToken,
} from "../../utils/jwt";

interface AuthResult {
  accessToken: string;
  refreshToken: string;
  user: { id: string; name: string; email: string; role: string };
}

async function issueTokensForUser(userId: string, req: Request): Promise<AuthResult> {
  const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } });

  const accessToken = signAccessToken({ sub: user.id, role: user.role, name: user.name });
  const rawRefreshToken = generateRefreshToken();

  await prisma.refreshToken.create({
    data: {
      tokenHash: hashRefreshToken(rawRefreshToken),
      userId: user.id,
      expiresAt: refreshTokenExpiryDate(),
      createdByIp: req.ip,
    },
  });

  return {
    accessToken,
    refreshToken: rawRefreshToken,
    user: { id: user.id, name: user.name, email: user.email, role: user.role },
  };
}

export async function login(email: string, password: string, req: Request): Promise<AuthResult> {
  const user = await prisma.user.findUnique({ where: { email } });

  if (!user || user.status !== "ACTIVE") {
    await recordAudit({ userId: null, action: "LOGIN_FAILED", req, metadata: { email } });
    throw new UnauthorizedError("Invalid email or password");
  }

  const passwordMatches = await bcrypt.compare(password, user.passwordHash);
  if (!passwordMatches) {
    await recordAudit({ userId: user.id, action: "LOGIN_FAILED", req, metadata: { email } });
    throw new UnauthorizedError("Invalid email or password");
  }

  const result = await issueTokensForUser(user.id, req);
  await recordAudit({ userId: user.id, action: "LOGIN_SUCCESS", req });
  return result;
}

export async function refresh(rawToken: string, req: Request): Promise<AuthResult> {
  const tokenHash = hashRefreshToken(rawToken);
  const existing = await prisma.refreshToken.findUnique({ where: { tokenHash } });

  if (!existing) {
    throw new UnauthorizedError("Invalid refresh token");
  }

  if (existing.revokedAt) {
    // A concurrent refresh (two tabs, a duplicate request) can legitimately reuse a
    // just-rotated token within a short window. Only treat reuse as theft once that
    // grace period has passed, otherwise transparently hand back the replacement chain.
    const gracePeriodMs = 10_000;
    const withinGracePeriod = Date.now() - existing.revokedAt.getTime() < gracePeriodMs;

    if (withinGracePeriod && existing.replacedByTokenHash) {
      const replacement = await prisma.refreshToken.findUnique({
        where: { tokenHash: existing.replacedByTokenHash },
      });
      if (replacement && !replacement.revokedAt && replacement.expiresAt > new Date()) {
        return issueTokensForUser(replacement.userId, req);
      }
    }

    // Reuse of a revoked/rotated token outside the grace period: possible theft, kill the whole chain.
    await prisma.refreshToken.updateMany({
      where: { userId: existing.userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
    throw new UnauthorizedError("Refresh token has been revoked");
  }

  if (existing.expiresAt < new Date()) {
    throw new UnauthorizedError("Refresh token has expired");
  }

  const result = await issueTokensForUser(existing.userId, req);

  await prisma.refreshToken.update({
    where: { id: existing.id },
    data: {
      revokedAt: new Date(),
      replacedByTokenHash: hashRefreshToken(result.refreshToken),
    },
  });

  return result;
}

export async function logout(rawToken: string): Promise<void> {
  const tokenHash = hashRefreshToken(rawToken);
  await prisma.refreshToken.updateMany({
    where: { tokenHash, revokedAt: null },
    data: { revokedAt: new Date() },
  });
}
