export interface ApiSuccess<T> {
  success: true;
  data: T;
}

export interface ApiFailure {
  success: false;
  message: string;
  errors: Array<{ field?: string; message: string }>;
}

export type ApiResponse<T> = ApiSuccess<T> | ApiFailure;

export class ApiError extends Error {
  errors: Array<{ field?: string; message: string }>;
  status?: number;

  constructor(message: string, errors: Array<{ field?: string; message: string }> = [], status?: number) {
    super(message);
    this.errors = errors;
    this.status = status;
  }
}
