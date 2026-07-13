import { axiosClient, unwrap } from "./axiosClient";
import type { AdminUser, UserInput } from "../types/user";

export const usersApi = {
  list: () => unwrap<AdminUser[]>(axiosClient.get("/users")),
  create: (input: UserInput) => unwrap<AdminUser>(axiosClient.post("/users", input)),
  update: (id: string, input: Partial<UserInput>) =>
    unwrap<AdminUser>(axiosClient.put(`/users/${id}`, input)),
  deactivate: (id: string) => unwrap<AdminUser>(axiosClient.delete(`/users/${id}`)),
};
