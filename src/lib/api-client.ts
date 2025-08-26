import axios, { AxiosInstance, AxiosResponse, AxiosError, InternalAxiosRequestConfig } from 'axios';

// Extend the Axios config type to include our metadata
declare module 'axios' {
  interface InternalAxiosRequestConfig {
    metadata?: {
      startTime: number;
    };
  }
}
import { TokenManager } from './cookies';
import type { 
  ApiResponse, 
  AuthResponse, 
  LoginRequest, 
  User, 
  Workspace, 
  Session, 
  ApiClientConfig 
} from '@/types/api';

/**
 * Centralized API Client for Raworc Bench
 * 
 * Features:
 * - Automatic token injection
 * - Request/Response interceptors
 * - Error handling and transformation
 * - Retry logic for failed requests
 * - Type-safe API methods
 */
class RaworcApiClient {
  private client: AxiosInstance;
  private baseURL: string;

  constructor(config: ApiClientConfig) {
    this.baseURL = config.baseURL;
    
    // Create axios instance with default config
    this.client = axios.create({
      baseURL: config.baseURL,
      timeout: config.timeout || 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  /**
   * Setup request and response interceptors
   * Why: Automatic token management, error handling, and response transformation
   */
  private setupInterceptors(): void {
    // Request interceptor - Add auth token automatically
    this.client.interceptors.request.use(
      (config: InternalAxiosRequestConfig) => {
        // Skip auth for public endpoints
        const publicEndpoints = ['/health', '/version', '/auth/internal'];
        const isPublicEndpoint = publicEndpoints.some(endpoint => 
          config.url?.includes(endpoint)
        );

        if (!isPublicEndpoint) {
          const authHeader = TokenManager.getAuthHeader();
          if (authHeader) {
            config.headers.Authorization = authHeader;
          }
        }

        // Add request timestamp for debugging
        config.metadata = { startTime: Date.now() };
        
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor - Handle responses and errors uniformly
    this.client.interceptors.response.use(
      (response: AxiosResponse) => {
        // Log response time in development
        if (process.env.NODE_ENV === 'development') {
          const startTime = response.config.metadata?.startTime;
          if (startTime) {
            console.log(`API Call: ${response.config.method?.toUpperCase()} ${response.config.url} - ${Date.now() - startTime}ms`);
          }
        }

        return response;
      },
      async (error: AxiosError) => {
        // Handle different error scenarios
        if (error.response?.status === 401) {
          // Token expired or invalid
          TokenManager.clearToken();
          // Redirect to login (will be handled by auth context)
          window.dispatchEvent(new CustomEvent('auth:logout'));
        }

        // Transform error to our standard format
        const apiError = this.transformError(error);
        return Promise.reject(apiError);
      }
    );
  }

  /**
   * Transform axios errors to our standard API error format
   */
  private transformError(error: AxiosError): ApiResponse {
    if (error.response) {
      // Server responded with error status
      const responseData = error.response.data as any;
      return {
        success: false,
        error: {
          message: responseData?.message || error.message || 'Server error occurred',
          code: error.response.status.toString(),
          details: error.response.data,
        },
      };
    } else if (error.request) {
      // Request made but no response received
      return {
        success: false,
        error: {
          message: 'Network error - please check your connection',
          code: 'NETWORK_ERROR',
          details: error.request,
        },
      };
    } else {
      // Something else happened
      return {
        success: false,
        error: {
          message: error.message || 'Unknown error occurred',
          code: 'UNKNOWN_ERROR',
        },
      };
    }
  }

  /**
   * Generic API request method
   */
  private async request<T>(
    method: 'GET' | 'POST' | 'PUT' | 'DELETE',
    endpoint: string,
    data?: any
  ): Promise<ApiResponse<T>> {
    try {
      const response = await this.client.request({
        method,
        url: endpoint,
        data,
      });

      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      return error as ApiResponse<T>;
    }
  }

  // =================
  // AUTHENTICATION
  // =================

  /**
   * Authenticate user and store token
   */
  async login(credentials: LoginRequest): Promise<ApiResponse<AuthResponse>> {
    const response = await this.request<AuthResponse>('POST', '/auth/internal', credentials);
    
    if (response.success && response.data) {
      // Store token securely
      TokenManager.setToken(response.data.token, response.data.expires_at);
    }
    
    return response;
  }

  /**
   * External authentication (if supported)
   */
  async externalAuth(provider: string, token: string): Promise<ApiResponse<AuthResponse>> {
    return this.request<AuthResponse>('POST', '/auth/external', { provider, token });
  }

  /**
   * Get current user information
   */
  async getCurrentUser(): Promise<ApiResponse<User>> {
    return this.request<User>('GET', '/auth/me');
  }

  /**
   * Logout user (clear local storage)
   */
  logout(): void {
    TokenManager.clearToken();
    window.dispatchEvent(new CustomEvent('auth:logout'));
  }

  // =================
  // SYSTEM ENDPOINTS
  // =================

  /**
   * Health check
   */
  async healthCheck(): Promise<ApiResponse<{ status: string; timestamp: string }>> {
    return this.request('GET', '/health');
  }

  /**
   * Get API version
   */
  async getVersion(): Promise<ApiResponse<{ version: string; build: string }>> {
    return this.request('GET', '/version');
  }

  // =================
  // WORKSPACES
  // =================

  /**
   * Get all workspaces
   */
  async getWorkspaces(): Promise<ApiResponse<Workspace[]>> {
    return this.request<Workspace[]>('GET', '/workspaces');
  }

  /**
   * Get specific workspace
   */
  async getWorkspace(id: string): Promise<ApiResponse<Workspace>> {
    return this.request<Workspace>('GET', `/workspaces/${id}`);
  }

  /**
   * Create new workspace
   */
  async createWorkspace(workspace: Omit<Workspace, 'id' | 'created_at' | 'updated_at'>): Promise<ApiResponse<Workspace>> {
    return this.request<Workspace>('POST', '/workspaces', workspace);
  }

  /**
   * Update workspace
   */
  async updateWorkspace(id: string, workspace: Partial<Workspace>): Promise<ApiResponse<Workspace>> {
    return this.request<Workspace>('PUT', `/workspaces/${id}`, workspace);
  }

  /**
   * Delete workspace
   */
  async deleteWorkspace(id: string): Promise<ApiResponse<void>> {
    return this.request<void>('DELETE', `/workspaces/${id}`);
  }

  // =================
  // SESSIONS
  // =================

  /**
   * Get all sessions in a workspace
   */
  async getSessions(workspaceId: string): Promise<ApiResponse<Session[]>> {
    return this.request<Session[]>('GET', `/workspaces/${workspaceId}/sessions`);
  }

  /**
   * Get specific session
   */
  async getSession(workspaceId: string, sessionId: string): Promise<ApiResponse<Session>> {
    return this.request<Session>('GET', `/workspaces/${workspaceId}/sessions/${sessionId}`);
  }

  /**
   * Create new session
   */
  async createSession(workspaceId: string, session: Omit<Session, 'id' | 'workspace_id' | 'created_at' | 'updated_at'>): Promise<ApiResponse<Session>> {
    return this.request<Session>('POST', `/workspaces/${workspaceId}/sessions`, session);
  }

  /**
   * Start session
   */
  async startSession(workspaceId: string, sessionId: string): Promise<ApiResponse<Session>> {
    return this.request<Session>('POST', `/workspaces/${workspaceId}/sessions/${sessionId}/start`);
  }

  /**
   * Stop session
   */
  async stopSession(workspaceId: string, sessionId: string): Promise<ApiResponse<Session>> {
    return this.request<Session>('POST', `/workspaces/${workspaceId}/sessions/${sessionId}/stop`);
  }

  /**
   * Delete session
   */
  async deleteSession(workspaceId: string, sessionId: string): Promise<ApiResponse<void>> {
    return this.request<void>('DELETE', `/workspaces/${workspaceId}/sessions/${sessionId}`);
  }

  // =================
  // UTILITY METHODS
  // =================

  /**
   * Check if client is authenticated
   */
  isAuthenticated(): boolean {
    return TokenManager.isAuthenticated();
  }

  /**
   * Get base URL
   */
  getBaseURL(): string {
    return this.baseURL;
  }

  /**
   * Update base URL (for different environments)
   */
  updateBaseURL(newBaseURL: string): void {
    this.baseURL = newBaseURL;
    this.client.defaults.baseURL = newBaseURL;
  }
}

// Create default client instance
const apiClient = new RaworcApiClient({
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:9000/api/v0',
  timeout: 10000,
  retries: 3,
});

export default apiClient;
export { RaworcApiClient };
