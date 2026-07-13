import { Request, Response } from "express";
import { env } from "../../config/env";
import { UnauthorizedError } from "../../errors/AppError";
import { ok } from "../../utils/response";
import * as authService from "./auth.service";

const REFRESH_COOKIE_NAME = "refreshToken";

const refreshCookieOptions = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: env.nodeEnv === "production",
  path: "/api/auth",
  maxAge: env.refreshTokenExpiresInHours * 60 * 60 * 1000,
};

function setRefreshCookie(res: Response, token: string) {
  res.cookie(REFRESH_COOKIE_NAME, token, refreshCookieOptions);
}

export async function login(req: Request, res: Response) {
  const { email, password } = req.body;
  const { accessToken, refreshToken, user } = await authService.login(email, password, req);
  setRefreshCookie(res, refreshToken);
  ok(res, { accessToken, user });
}

export async function refreshToken(req: Request, res: Response) {
  const token = req.cookies?.[REFRESH_COOKIE_NAME];
  if (!token) {
    throw new UnauthorizedError("No refresh token provided");
  }

  const { accessToken, refreshToken: newRefreshToken, user } = await authService.refresh(
    token,
    req
  );
  setRefreshCookie(res, newRefreshToken);
  ok(res, { accessToken, user });
}

export async function logout(req: Request, res: Response) {
  const token = req.cookies?.[REFRESH_COOKIE_NAME];
  if (token) {
    await authService.logout(token);
  }
  res.clearCookie(REFRESH_COOKIE_NAME, { path: "/api/auth" });
  ok(res, { loggedOut: true });
}
