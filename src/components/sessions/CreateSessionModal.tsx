'use client';

import React, { useState } from 'react';
import Button from '@/components/ui/Button';
import { X, Container, Plus, Minus } from 'lucide-react';
import type { Session, Workspace } from '@/types/api';
import apiClient from '@/lib/api-client';

interface CreateSessionModalProps {
  workspace: Workspace;
  onClose: () => void;
  onSuccess: (session: Session) => void;
}

/**
 * Create Session Modal Component
 * 
 * Features:
 * - Session configuration form
 * - Container settings
 * - Environment variables
 * - Port configuration
 * - Form validation
 */
const CreateSessionModal: React.FC<CreateSessionModalProps> = ({
  workspace,
  onClose,
  onSuccess,
}) => {
  const [formData, setFormData] = useState({
    name: '',
    container_info: {
      image: 'ubuntu:latest',
      ports: ['3000'],
      environment: {} as Record<string, string>,
    },
  });
  
  const [envVars, setEnvVars] = useState<Array<{ key: string; value: string }>>([
    { key: '', value: '' }
  ]);
  
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  /**
   * Validate form data
   */
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Session name is required';
    } else if (formData.name.length < 3) {
      newErrors.name = 'Session name must be at least 3 characters';
    }

    if (!formData.container_info.image.trim()) {
      newErrors.image = 'Container image is required';
    }

    // Validate ports
    const portNumbers = formData.container_info.ports.map(port => parseInt(port));
    if (portNumbers.some(port => isNaN(port) || port < 1 || port > 65535)) {
      newErrors.ports = 'Invalid port numbers';
    }

    // Validate environment variables
    const validEnvVars = envVars.filter(env => env.key.trim() && env.value.trim());
    if (envVars.some(env => env.key.trim() && !env.value.trim())) {
      newErrors.environment = 'Environment variable values cannot be empty';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  /**
   * Handle form submission
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    // Process environment variables
    const environment = envVars.reduce((acc, env) => {
      if (env.key.trim() && env.value.trim()) {
        acc[env.key.trim()] = env.value.trim();
      }
      return acc;
    }, {} as Record<string, string>);

    setLoading(true);
    try {
      const sessionData = {
        name: formData.name.trim(),
        status: 'stopped' as const,
        container_info: {
          image: formData.container_info.image.trim(),
          ports: formData.container_info.ports.map(port => parseInt(port)),
          environment,
        },
      };

      const response = await apiClient.createSession(workspace.id, sessionData);

      if (response.success && response.data) {
        onSuccess(response.data);
      } else {
        setErrors({ 
          submit: response.error?.message || 'Failed to create session' 
        });
      }
    } catch (error) {
      setErrors({ 
        submit: 'Failed to create session. Please try again.' 
      });
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handle ports input change
   */
  const handlePortsChange = (value: string) => {
    const ports = value.split(',').map(port => port.trim()).filter(port => port);
    setFormData(prev => ({
      ...prev,
      container_info: {
        ...prev.container_info,
        ports,
      },
    }));
  };

  /**
   * Add environment variable
   */
  const addEnvVar = () => {
    setEnvVars(prev => [...prev, { key: '', value: '' }]);
  };

  /**
   * Remove environment variable
   */
  const removeEnvVar = (index: number) => {
    setEnvVars(prev => prev.filter((_, i) => i !== index));
  };

  /**
   * Update environment variable
   */
  const updateEnvVar = (index: number, field: 'key' | 'value', value: string) => {
    setEnvVars(prev => 
      prev.map((env, i) => 
        i === index ? { ...env, [field]: value } : env
      )
    );
  };

  /**
   * Handle backdrop click
   */
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
      onClick={handleBackdropClick}
    >
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center">
            <Container className="h-6 w-6 text-blue-600 mr-3" />
            <h2 className="text-lg font-semibold text-gray-900">
              Create New Session
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-full p-1"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6">
          <div className="space-y-6">
            {/* Session Name */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                Session Name *
              </label>
              <input
                id="name"
                type="text"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.name ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="Enter session name"
              />
              {errors.name && (
                <p className="mt-1 text-sm text-red-600">{errors.name}</p>
              )}
            </div>

            {/* Container Image */}
            <div>
              <label htmlFor="image" className="block text-sm font-medium text-gray-700 mb-2">
                Container Image *
              </label>
              <input
                id="image"
                type="text"
                value={formData.container_info.image}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  container_info: {
                    ...prev.container_info,
                    image: e.target.value,
                  },
                }))}
                className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.image ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="ubuntu:latest"
              />
              {errors.image && (
                <p className="mt-1 text-sm text-red-600">{errors.image}</p>
              )}
              <p className="mt-1 text-sm text-gray-500">
                Docker image to use for this session (e.g., ubuntu:latest, node:18, python:3.9)
              </p>
            </div>

            {/* Ports */}
            <div>
              <label htmlFor="ports" className="block text-sm font-medium text-gray-700 mb-2">
                Ports
              </label>
              <input
                id="ports"
                type="text"
                value={formData.container_info.ports.join(', ')}
                onChange={(e) => handlePortsChange(e.target.value)}
                className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.ports ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="3000, 8080, 9000"
              />
              {errors.ports && (
                <p className="mt-1 text-sm text-red-600">{errors.ports}</p>
              )}
              <p className="mt-1 text-sm text-gray-500">
                Comma-separated list of ports to expose
              </p>
            </div>

            {/* Environment Variables */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="block text-sm font-medium text-gray-700">
                  Environment Variables
                </label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addEnvVar}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add
                </Button>
              </div>
              
              <div className="space-y-2">
                {envVars.map((env, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <input
                      type="text"
                      value={env.key}
                      onChange={(e) => updateEnvVar(index, 'key', e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="VARIABLE_NAME"
                    />
                    <span className="text-gray-500">=</span>
                    <input
                      type="text"
                      value={env.value}
                      onChange={(e) => updateEnvVar(index, 'value', e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="value"
                    />
                    {envVars.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeEnvVar(index)}
                        className="p-2 text-gray-400 hover:text-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 rounded"
                      >
                        <Minus className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
              
              {errors.environment && (
                <p className="mt-1 text-sm text-red-600">{errors.environment}</p>
              )}
            </div>
          </div>

          {/* Submit Error */}
          {errors.submit && (
            <div className="mt-6 p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-600">{errors.submit}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end space-x-3 mt-6">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              loading={loading}
              disabled={loading}
            >
              Create Session
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateSessionModal;
