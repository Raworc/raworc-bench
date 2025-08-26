'use client';

import React, { useState, useEffect } from 'react';
import Button from '@/components/ui/Button';
import WorkspaceCard from './WorkspaceCard';
import CreateWorkspaceModal from './CreateWorkspaceModal';
import { Plus, FolderOpen, RefreshCw } from 'lucide-react';
import type { Workspace } from '@/types/api';
import apiClient from '@/lib/api-client';

interface WorkspaceListProps {
  onWorkspaceSelect: (workspace: Workspace) => void;
  onWorkspaceChange?: () => void;
}

/**
 * Workspace List Component
 * 
 * Features:
 * - Display all workspaces
 * - Create new workspaces
 * - Edit/delete workspaces
 * - Refresh workspace list
 * - Loading and error states
 */
const WorkspaceList: React.FC<WorkspaceListProps> = ({ 
  onWorkspaceSelect,
  onWorkspaceChange 
}) => {
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Load workspaces on mount
  useEffect(() => {
    loadWorkspaces();
  }, []);

  /**
   * Load workspaces from API
   */
  const loadWorkspaces = async () => {
    try {
      setError(null);
      const response = await apiClient.getWorkspaces();
      
      if (response.success && response.data) {
        setWorkspaces(response.data);
      } else {
        setError(response.error?.message || 'Failed to load workspaces');
      }
    } catch (err) {
      setError('Failed to load workspaces');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Refresh workspace list
   */
  const handleRefresh = async () => {
    setRefreshing(true);
    await loadWorkspaces();
    setRefreshing(false);
    onWorkspaceChange?.();
  };

  /**
   * Handle workspace creation
   */
  const handleWorkspaceCreated = (newWorkspace: Workspace) => {
    setWorkspaces(prev => [...prev, newWorkspace]);
    setShowCreateModal(false);
    onWorkspaceChange?.();
  };

  /**
   * Handle workspace update
   */
  const handleWorkspaceUpdated = (updatedWorkspace: Workspace) => {
    setWorkspaces(prev => 
      prev.map(workspace => 
        workspace.id === updatedWorkspace.id ? updatedWorkspace : workspace
      )
    );
    onWorkspaceChange?.();
  };

  /**
   * Handle workspace deletion
   */
  const handleWorkspaceDeleted = (deletedWorkspaceId: string) => {
    setWorkspaces(prev => 
      prev.filter(workspace => workspace.id !== deletedWorkspaceId)
    );
    onWorkspaceChange?.();
  };

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 dark:border-blue-400"></div>
        <span className="ml-2 text-gray-600 dark:text-gray-300">Loading workspaces...</span>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="text-center py-12">
        <div className="text-red-600 dark:text-red-400 mb-4">{error}</div>
        <Button onClick={loadWorkspaces} variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Workspaces</h1>
          <p className="text-gray-600 dark:text-gray-300 mt-1">
            Manage your development environments and containerized sessions
          </p>
        </div>
        
        <div className="flex space-x-3">
          <Button 
            variant="outline" 
            onClick={handleRefresh}
            disabled={refreshing}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          
          <Button onClick={() => setShowCreateModal(true)}>
            <Plus className="h-4 w-4 mr-2" />
            New Workspace
          </Button>
        </div>
      </div>

      {/* Workspace Grid */}
      {workspaces.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {workspaces.map((workspace) => (
            <WorkspaceCard
              key={workspace.id}
              workspace={workspace}
              onSelect={() => onWorkspaceSelect(workspace)}
              onUpdate={handleWorkspaceUpdated}
              onDelete={handleWorkspaceDeleted}
            />
          ))}
        </div>
      ) : (
        // Empty state
        <div className="text-center py-12">
          <FolderOpen className="h-12 w-12 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">No workspaces found</h3>
          <p className="text-gray-600 dark:text-gray-300 mb-6">
            Get started by creating your first workspace
          </p>
          <Button onClick={() => setShowCreateModal(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Create Workspace
          </Button>
        </div>
      )}

      {/* Create Workspace Modal */}
      {showCreateModal && (
        <CreateWorkspaceModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={handleWorkspaceCreated}
        />
      )}
    </div>
  );
};

export default WorkspaceList;
