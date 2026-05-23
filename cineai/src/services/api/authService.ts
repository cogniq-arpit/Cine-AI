import { apiClient } from './apiClient';

export interface UserResponse {
  id: string;
  name: string;
  username: string;
}

export interface AuthResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  user: UserResponse;
}

export const authService = {
  /**
   * Registers a new account.
   */
  signup: async (name: string, username: string, email: string, password: string): Promise<AuthResponse> => {
    const response = await apiClient.post<AuthResponse>('/auth/signup', {
      name,
      username,
      email,
      password,
    });
    return response.data;
  },

  /**
   * Logs into an existing account using username or email.
   */
  login: async (identifier: string, password: string): Promise<AuthResponse> => {
    const response = await apiClient.post<AuthResponse>('/auth/login', {
      identifier,
      password,
    });
    return response.data;
  },
};
