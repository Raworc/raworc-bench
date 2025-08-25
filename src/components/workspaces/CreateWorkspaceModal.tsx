'use client';

import React, { useState } from 'react';
import Button from '@/components/ui/Button';
import { X, FolderPlus } from 'lucide-react';
import type { Workspace } from '@/types/api';
import apiClient from '@/lib/api-client';

interface CreateWorkspaceModalProps {
  onClose: () => void;
  onSuccess: (workspace: Workspace) => void;
}

/**
 * Create Workspace Modal Component
 * 
 * Features:
 * - Form validation
 * - Loading states
 * - Error handling
 * - Responsive design
 */
const CreateWorkspaceModal: React.FC<CreateWorkspaceModalProps> = ({
  onClose,
  onSuccess,
}) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
  });
  
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  /**
   * Validate form data
   */
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Workspace name is required';
    } else if (formData.name.length < 3) {
      newErrors.name = 'Workspace name must be at least 3 characters';
    } else if (formData.name.length > 50) {
      newErrors.name = 'Workspace name must be less than 50 characters';
    }

    if (formData.description && formData.description.length > 200) {
      newErrors.description = 'Description must be less than 200 characters';
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

    setLoading(true);
    try {
      const response = await apiClient.createWorkspace({
        name: formData.name.trim(),
        description: formData.description.trim() || undefined,
      });

      if (response.success && response.data) {
        onSuccess(response.data);
      } else {
        setErrors({ 
          submit: response.error?.message || 'Failed to create workspace' 
        });
      }
    } catch (error) {
      setErrors({ 
        submit: 'Failed to create workspace. Please try again.' 
      });
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handle input changes
   */
  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear field-specific error
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
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
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center">
            <FolderPlus className="h-6 w-6 text-blue-600 mr-3" />
            <h2 className="text-lg font-semibold text-gray-900">
              Create New Workspace
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
          <div className="space-y-4">
            {/* Workspace Name */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                Workspace Name *
              </label>
              <input
                id="name"
                type="text"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.name ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="Enter workspace name"
                maxLength={50}
              />
              {errors.name && (
                <p className="mt-1 text-sm text-red-600">{errors.name}</p>
              )}
            </div>

            {/* Description */}
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                rows={3}
                className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.description ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="Optional description for this workspace"
                maxLength={200}
              />
              <div className="flex justify-between mt-1">
                {errors.description && (
                  <p className="text-sm text-red-600">{errors.description}</p>
                )}
                <p className="text-xs text-gray-500 ml-auto">
                  {formData.description.length}/200
                </p>
              </div>
            </div>
          </div>

          {/* Submit Error */}
          {errors.submit && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
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
              Create Workspace
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateWorkspaceModal;
