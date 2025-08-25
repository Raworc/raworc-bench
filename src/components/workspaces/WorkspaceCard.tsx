'use client';

import React, { useState } from 'react';
import Button from '@/components/ui/Button';
import { 
  MoreVertical, 
  Edit, 
  Trash2, 
  FolderOpen, 
  Calendar,
  Settings,
  Play 
} from 'lucide-react';
import { formatRelativeTime } from '@/lib/utils';
import type { Workspace } from '@/types/api';
import apiClient from '@/lib/api-client';

interface WorkspaceCardProps {
  workspace: Workspace;
  onSelect: () => void;
  onUpdate: (workspace: Workspace) => void;
  onDelete: (workspaceId: string) => void;
}

/**
 * Workspace Card Component
 * 
 * Features:
 * - Display workspace information
 * - Quick actions (edit, delete, open)
 * - Session count and status
 * - Responsive design
 */
const WorkspaceCard: React.FC<WorkspaceCardProps> = ({
  workspace,
  onSelect,
  onUpdate,
  onDelete,
}) => {
  const [showMenu, setShowMenu] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [sessionCount, setSessionCount] = useState<number | null>(null);

  // Load session count when component mounts
  React.useEffect(() => {
    loadSessionCount();
  }, [workspace.id]);

  /**
   * Load session count for this workspace
   */
  const loadSessionCount = async () => {
    try {
      const response = await apiClient.getSessions(workspace.id);
      if (response.success && response.data) {
        setSessionCount(response.data.length);
      }
    } catch (error) {
      console.error('Failed to load session count:', error);
    }
  };

  /**
   * Handle workspace deletion
   */
  const handleDelete = async () => {
    if (!confirm(`Are you sure you want to delete "${workspace.name}"? This action cannot be undone.`)) {
      return;
    }

    setIsDeleting(true);
    try {
      const response = await apiClient.deleteWorkspace(workspace.id);
      
      if (response.success) {
        onDelete(workspace.id);
      } else {
        alert(response.error?.message || 'Failed to delete workspace');
      }
    } catch (error) {
      alert('Failed to delete workspace');
    } finally {
      setIsDeleting(false);
      setShowMenu(false);
    }
  };

  /**
   * Handle edit (placeholder for now)
   */
  const handleEdit = () => {
    // TODO: Implement edit modal
    alert('Edit functionality coming soon!');
    setShowMenu(false);
  };

  return (
    <div className="bg-white rounded-lg shadow border hover:shadow-md transition-shadow duration-200">
      {/* Card Header */}
      <div className="p-6 pb-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <FolderOpen className="h-8 w-8 text-blue-600" />
            </div>
            <div className="ml-3">
              <h3 className="text-lg font-medium text-gray-900 truncate">
                {workspace.name}
              </h3>
              {workspace.description && (
                <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                  {workspace.description}
                </p>
              )}
            </div>
          </div>

          {/* Menu Button */}
          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="p-1 rounded-full hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <MoreVertical className="h-5 w-5 text-gray-400" />
            </button>

            {/* Dropdown Menu */}
            {showMenu && (
              <>
                {/* Backdrop */}
                <div 
                  className="fixed inset-0 z-10" 
                  onClick={() => setShowMenu(false)}
                />
                
                {/* Menu */}
                <div className="absolute right-0 mt-1 w-48 bg-white rounded-md shadow-lg z-20 border">
                  <div className="py-1">
                    <button
                      onClick={handleEdit}
                      className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                    >
                      <Edit className="h-4 w-4 mr-3" />
                      Edit
                    </button>
                    <button
                      onClick={handleDelete}
                      disabled={isDeleting}
                      className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 disabled:opacity-50"
                    >
                      <Trash2 className="h-4 w-4 mr-3" />
                      {isDeleting ? 'Deleting...' : 'Delete'}
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Card Body */}
      <div className="px-6 pb-4">
        <div className="flex items-center justify-between text-sm text-gray-500">
          <div className="flex items-center">
            <Calendar className="h-4 w-4 mr-1" />
            Created {formatRelativeTime(workspace.created_at)}
          </div>
          
          {sessionCount !== null && (
            <div className="flex items-center">
              <Settings className="h-4 w-4 mr-1" />
              {sessionCount} session{sessionCount !== 1 ? 's' : ''}
            </div>
          )}
        </div>
      </div>

      {/* Card Footer */}
      <div className="px-6 py-4 bg-gray-50 rounded-b-lg">
        <div className="flex space-x-3">
          <Button
            onClick={onSelect}
            className="flex-1"
            size="sm"
          >
            <Play className="h-4 w-4 mr-2" />
            Open
          </Button>
          
          <Button
            onClick={() => {
              // Quick action to manage sessions
              onSelect();
            }}
            variant="outline"
            size="sm"
          >
            <Settings className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default WorkspaceCard;
