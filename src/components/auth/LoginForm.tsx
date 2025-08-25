'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import Button from '@/components/ui/Button';
import { Eye, EyeOff, Lock, User, Server } from 'lucide-react';

interface LoginFormProps {
  onSuccess?: () => void;
}

/**
 * Login Form Component
 * 
 * Features:
 * - Form validation
 * - Password visibility toggle
 * - Loading states
 * - Error handling
 * - Server URL configuration
 */
const LoginForm: React.FC<LoginFormProps> = ({ onSuccess }) => {
  const { login, isLoading, error, clearError } = useAuth();
  
  // Form state
  const [formData, setFormData] = useState({
    user: '',
    pass: '',
    serverUrl: 'http://localhost:9000',
  });
  
  const [showPassword, setShowPassword] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  // Clear error when form changes
  useEffect(() => {
    if (error) {
      clearError();
    }
  }, [formData]);

  /**
   * Validate form data
   */
  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!formData.user.trim()) {
      errors.user = 'Username is required';
    }

    if (!formData.pass.trim()) {
      errors.pass = 'Password is required';
    }

    if (!formData.serverUrl.trim()) {
      errors.serverUrl = 'Server URL is required';
    } else {
      try {
        new URL(formData.serverUrl);
      } catch {
        errors.serverUrl = 'Please enter a valid URL';
      }
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  /**
   * Handle form submission
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    // Update API client base URL
    const apiClient = (await import('@/lib/api-client')).default;
    const baseUrl = formData.serverUrl.endsWith('/') 
      ? `${formData.serverUrl}api/v0` 
      : `${formData.serverUrl}/api/v0`;
    apiClient.updateBaseURL(baseUrl);
    console.log('Updated API base URL to:', baseUrl);

    // Attempt login
    const success = await login({
      user: formData.user,
      pass: formData.pass,
    });

    if (success) {
      onSuccess?.();
    }
  };

  /**
   * Handle input changes
   */
  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear field-specific error
    if (validationErrors[field]) {
      setValidationErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div>
          <div className="mx-auto h-12 w-12 flex items-center justify-center bg-blue-600 rounded-full">
            <Server className="h-6 w-6 text-white" />
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Raworc Bench
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Sign in to your account
          </p>
        </div>

        {/* Login Form */}
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            {/* Server URL */}
            <div>
              <label htmlFor="serverUrl" className="block text-sm font-medium text-gray-700 mb-1">
                Server URL
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Server className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="serverUrl"
                  name="serverUrl"
                  type="url"
                  value={formData.serverUrl}
                  onChange={(e) => handleInputChange('serverUrl', e.target.value)}
                  className={`appearance-none relative block w-full pl-10 pr-3 py-2 border ${
                    validationErrors.serverUrl ? 'border-red-300' : 'border-gray-300'
                  } placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm`}
                  placeholder="http://localhost:9000"
                />
              </div>
              {validationErrors.serverUrl && (
                <p className="mt-1 text-sm text-red-600">{validationErrors.serverUrl}</p>
              )}
            </div>

            {/* Username */}
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">
                Username
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="username"
                  name="username"
                  type="text"
                  value={formData.user}
                  onChange={(e) => handleInputChange('user', e.target.value)}
                  className={`appearance-none relative block w-full pl-10 pr-3 py-2 border ${
                    validationErrors.user ? 'border-red-300' : 'border-gray-300'
                  } placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm`}
                  placeholder="admin"
                />
              </div>
              {validationErrors.user && (
                <p className="mt-1 text-sm text-red-600">{validationErrors.user}</p>
              )}
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  value={formData.pass}
                  onChange={(e) => handleInputChange('pass', e.target.value)}
                  className={`appearance-none relative block w-full pl-10 pr-10 py-2 border ${
                    validationErrors.pass ? 'border-red-300' : 'border-gray-300'
                  } placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm`}
                  placeholder="Password"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-500" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-400 hover:text-gray-500" />
                  )}
                </button>
              </div>
              {validationErrors.pass && (
                <p className="mt-1 text-sm text-red-600">{validationErrors.pass}</p>
              )}
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-3">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {/* Submit Button */}
          <div>
            <Button
              type="submit"
              className="group relative w-full flex justify-center"
              loading={isLoading}
              disabled={isLoading}
            >
              Sign in
            </Button>
          </div>

          {/* API Information */}
          <div className="text-center">
            <div className="text-xs text-gray-500 space-y-1">
              <p>Default credentials: admin / your-password</p>
              <p>API Base: /api/v0</p>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LoginForm;
