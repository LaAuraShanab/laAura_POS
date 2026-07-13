export type Role = "ADMIN" | "MANAGER" | "CASHIER" | "REPORTER";
export type UserStatus = "ACTIVE" | "INACTIVE";

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: Role;
}

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: Role;
  status: UserStatus;
  createdAt: string;
  updatedAt: string;
}

export interface UserInput {
  name: string;
  email: string;
  password?: string;
  role: Role;
  status?: UserStatus;
}
