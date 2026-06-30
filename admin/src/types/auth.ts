export interface AuthUser {
  id: string;
  email: string;
  name?: string;
  role: string;
}

export interface LoginPayload {
  email: string;
  password: string;
  rememberMe?: boolean;
}
