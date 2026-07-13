import { axiosClient, unwrap } from "./axiosClient";
import type { AuthUser } from "../types/user";

interface LoginResponse {
  accessToken: string;
  user: AuthUser;
}

export const authApi = {
  login: (email: string, password: string) =>
    unwrap<LoginResponse>(axiosClient.post("/auth/login", { email, password })),
  refresh: () => unwrap<LoginResponse>(axiosClient.post("/auth/refresh-token")),
  logout: () => unwrap<{ loggedOut: boolean }>(axiosClient.post("/auth/logout")),
};
