'use client';

import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import { TokenManager } from '@/lib/cookies';
import apiClient from '@/lib/api-client';
import type { User, LoginRequest, ApiResponse } from '@/types/api';

// Auth State Interface
interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

// Auth Actions
type AuthAction =
  | { type: 'AUTH_START' }
  | { type: 'AUTH_SUCCESS'; payload: User }
  | { type: 'AUTH_ERROR'; payload: string }
  | { type: 'AUTH_LOGOUT' }
  | { type: 'CLEAR_ERROR' };

// Auth Context Interface
interface AuthContextType extends AuthState {
  login: (credentials: LoginRequest) => Promise<boolean>;
  logout: () => void;
  checkAuth: () => Promise<void>;
  clearError: () => void;
}

// Initial State
const initialState: AuthState = {
  user: null,
  isAuthenticated: false,
  isLoading: true,
  error: null,
};

// Auth Reducer
const authReducer = (state: AuthState, action: AuthAction): AuthState => {
  switch (action.type) {
    case 'AUTH_START':
      return {
        ...state,
        isLoading: true,
        error: null,
      };
    
    case 'AUTH_SUCCESS':
      return {
        ...state,
        user: action.payload,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      };
    
    case 'AUTH_ERROR':
      return {
        ...state,
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: action.payload,
      };
    
    case 'AUTH_LOGOUT':
      return {
        ...state,
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
      };
    
    case 'CLEAR_ERROR':
      return {
        ...state,
        error: null,
      };
    
    default:
      return state;
  }
};

// Create Context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Auth Provider Props
interface AuthProviderProps {
  children: ReactNode;
}

/**
 * Authentication Provider Component
 * 
 * Manages:
 * - User authentication state
 * - Login/logout functionality
 * - Automatic token validation
 * - Error handling for auth operations
 */
export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  /**
   * Check if user is authenticated on app load
   */
  const checkAuth = async (): Promise<void> => {
    dispatch({ type: 'AUTH_START' });

    try {
      // Check if we have a valid token
      if (!TokenManager.isAuthenticated()) {
        dispatch({ type: 'AUTH_LOGOUT' });
        return;
      }

      // Verify token with server and get user info
      const response = await apiClient.getCurrentUser();
      
      if (response.success && response.data) {
        dispatch({ type: 'AUTH_SUCCESS', payload: response.data });
      } else {
        // Token is invalid, clear it
        TokenManager.clearToken();
        dispatch({ type: 'AUTH_ERROR', payload: response.error?.message || 'Authentication failed' });
      }
    } catch (error) {
      TokenManager.clearToken();
      dispatch({ type: 'AUTH_ERROR', payload: 'Authentication check failed' });
    }
  };

  /**
   * Login user with credentials
   */
  const login = async (credentials: LoginRequest): Promise<boolean> => {
    dispatch({ type: 'AUTH_START' });

    try {
      const response = await apiClient.login(credentials);
      
      if (response.success && response.data) {
        // Get user info after successful login
        const userResponse = await apiClient.getCurrentUser();
        
        if (userResponse.success && userResponse.data) {
          dispatch({ type: 'AUTH_SUCCESS', payload: userResponse.data });
          return true;
        } else {
          dispatch({ type: 'AUTH_ERROR', payload: 'Failed to get user information' });
          return false;
        }
      } else {
        dispatch({ type: 'AUTH_ERROR', payload: response.error?.message || 'Login failed' });
        return false;
      }
    } catch (error) {
      dispatch({ type: 'AUTH_ERROR', payload: 'Login request failed' });
      return false;
    }
  };

  /**
   * Logout user and clear all data
   */
  const logout = (): void => {
    TokenManager.clearToken();
    dispatch({ type: 'AUTH_LOGOUT' });
  };

  /**
   * Clear error state
   */
  const clearError = (): void => {
    dispatch({ type: 'CLEAR_ERROR' });
  };

  // Setup event listeners for token expiration
  useEffect(() => {
    // Check auth status on mount
    checkAuth();

    // Listen for logout events (from API client or other tabs)
    const handleLogout = () => {
      dispatch({ type: 'AUTH_LOGOUT' });
    };

    window.addEventListener('auth:logout', handleLogout);

    // Check for token expiration periodically
    const tokenCheckInterval = setInterval(() => {
      if (TokenManager.isTokenExpiringSoon()) {
        // Could implement token refresh here
        console.warn('Token expiring soon, consider refreshing');
      }
      
      if (!TokenManager.isAuthenticated() && state.isAuthenticated) {
        dispatch({ type: 'AUTH_LOGOUT' });
      }
    }, 60000); // Check every minute

    return () => {
      window.removeEventListener('auth:logout', handleLogout);
      clearInterval(tokenCheckInterval);
    };
  }, []);

  // Context value
  const contextValue: AuthContextType = {
    ...state,
    login,
    logout,
    checkAuth,
    clearError,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

/**
 * Custom hook to use auth context
 */
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return context;
};

/**
 * Higher-order component for protected routes
 */
export const withAuth = <P extends object>(
  WrappedComponent: React.ComponentType<P>
): React.FC<P> => {
  const AuthenticatedComponent: React.FC<P> = (props) => {
    const { isAuthenticated, isLoading } = useAuth();

    if (isLoading) {
      return (
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      );
    }

    if (!isAuthenticated) {
      return (
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h2>
            <p className="text-gray-600">Please log in to access this page.</p>
          </div>
        </div>
      );
    }

    return <WrappedComponent {...props} />;
  };

  AuthenticatedComponent.displayName = `withAuth(${WrappedComponent.displayName || WrappedComponent.name})`;

  return AuthenticatedComponent;
};
