// API Types for Raworc Bench
export interface AuthResponse {
  token: string;
  token_type: string;
  expires_at: string;
}

export interface LoginRequest {
  user: string;
  pass: string;
}

export interface User {
  id: string;
  username: string;
  email?: string;
  roles: string[];
}

export interface Workspace {
  id: string;
  name: string;
  description?: string;
  created_at: string;
  updated_at: string;
}

export interface Session {
  id: string;
  workspace_id: string;
  name: string;
  status: 'running' | 'stopped' | 'pending' | 'error';
  created_at: string;
  updated_at: string;
  container_info?: {
    image: string;
    ports: number[];
    environment: Record<string, string>;
  };
}

export interface ApiError {
  message: string;
  code: string;
  details?: any;
}

export interface ApiResponse<T = any> {
  data?: T;
  error?: ApiError;
  success: boolean;
}

// API Client Configuration
export interface ApiClientConfig {
  baseURL: string;
  timeout?: number;
  retries?: number;
}
