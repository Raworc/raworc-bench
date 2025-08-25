'use client';

import React, { useState } from 'react';
import Button from '@/components/ui/Button';
import { 
  Play, 
  Square, 
  MoreVertical, 
  Trash2, 
  Activity,
  Clock,
  Container,
  ExternalLink
} from 'lucide-react';
import { formatRelativeTime, capitalize } from '@/lib/utils';
import type { Session, Workspace } from '@/types/api';
import apiClient from '@/lib/api-client';

interface SessionCardProps {
  session: Session;
  workspace: Workspace;
  onUpdate: (session: Session) => void;
  onDelete: (sessionId: string) => void;
}

/**
 * Session Card Component
 * 
 * Features:
 * - Display session information and status
 * - Start/stop session controls
 * - Container information
 * - Delete functionality
 * - Real-time status updates
 */
const SessionCard: React.FC<SessionCardProps> = ({
  session,
  workspace,
  onUpdate,
  onDelete,
}) => {
  const [showMenu, setShowMenu] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  /**
   * Get status color and icon
   */
  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'running':
        return {
          color: 'text-green-600 bg-green-100',
          icon: <Play className="h-3 w-3" />,
          label: 'Running'
        };
      case 'stopped':
        return {
          color: 'text-gray-600 bg-gray-100',
          icon: <Square className="h-3 w-3" />,
          label: 'Stopped'
        };
      case 'pending':
        return {
          color: 'text-yellow-600 bg-yellow-100',
          icon: <Clock className="h-3 w-3" />,
          label: 'Pending'
        };
      case 'error':
        return {
          color: 'text-red-600 bg-red-100',
          icon: <Activity className="h-3 w-3" />,
          label: 'Error'
        };
      default:
        return {
          color: 'text-gray-600 bg-gray-100',
          icon: <Activity className="h-3 w-3" />,
          label: capitalize(status)
        };
    }
  };

  /**
   * Handle session start
   */
  const handleStart = async () => {
    setActionLoading('start');
    try {
      const response = await apiClient.startSession(workspace.id, session.id);
      if (response.success && response.data) {
        onUpdate(response.data);
      } else {
        alert(response.error?.message || 'Failed to start session');
      }
    } catch (error) {
      alert('Failed to start session');
    } finally {
      setActionLoading(null);
    }
  };

  /**
   * Handle session stop
   */
  const handleStop = async () => {
    setActionLoading('stop');
    try {
      const response = await apiClient.stopSession(workspace.id, session.id);
      if (response.success && response.data) {
        onUpdate(response.data);
      } else {
        alert(response.error?.message || 'Failed to stop session');
      }
    } catch (error) {
      alert('Failed to stop session');
    } finally {
      setActionLoading(null);
    }
  };

  /**
   * Handle session deletion
   */
  const handleDelete = async () => {
    if (!confirm(`Are you sure you want to delete "${session.name}"? This action cannot be undone.`)) {
      return;
    }

    setActionLoading('delete');
    try {
      const response = await apiClient.deleteSession(workspace.id, session.id);
      
      if (response.success) {
        onDelete(session.id);
      } else {
        alert(response.error?.message || 'Failed to delete session');
      }
    } catch (error) {
      alert('Failed to delete session');
    } finally {
      setActionLoading(null);
      setShowMenu(false);
    }
  };

  const statusInfo = getStatusInfo(session.status);
  const canStart = session.status === 'stopped';
  const canStop = session.status === 'running';

  return (
    <div className="bg-white rounded-lg shadow border hover:shadow-md transition-shadow duration-200">
      {/* Card Header */}
      <div className="p-6 pb-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center min-w-0 flex-1">
            <div className="flex-shrink-0">
              <Container className="h-8 w-8 text-blue-600" />
            </div>
            <div className="ml-3 min-w-0 flex-1">
              <h3 className="text-lg font-medium text-gray-900 truncate">
                {session.name}
              </h3>
              <div className="flex items-center mt-1">
                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${statusInfo.color}`}>
                  {statusInfo.icon}
                  <span className="ml-1">{statusInfo.label}</span>
                </span>
              </div>
            </div>
          </div>

          {/* Menu Button */}
          <div className="relative ml-3">
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
                      onClick={handleDelete}
                      disabled={actionLoading === 'delete'}
                      className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 disabled:opacity-50"
                    >
                      <Trash2 className="h-4 w-4 mr-3" />
                      {actionLoading === 'delete' ? 'Deleting...' : 'Delete'}
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Container Info */}
      {session.container_info && (
        <div className="px-6 pb-4">
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="text-sm">
              <div className="font-medium text-gray-700 mb-1">Container Info</div>
              <div className="text-gray-600 space-y-1">
                <div>Image: {session.container_info.image}</div>
                {session.container_info.ports && session.container_info.ports.length > 0 && (
                  <div>Ports: {session.container_info.ports.join(', ')}</div>
                )}
                {session.container_info.environment && Object.keys(session.container_info.environment).length > 0 && (
                  <div>
                    Environment: {Object.keys(session.container_info.environment).length} variables
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Timestamps */}
      <div className="px-6 pb-4">
        <div className="text-sm text-gray-500">
          <div>Created {formatRelativeTime(session.created_at)}</div>
          <div>Updated {formatRelativeTime(session.updated_at)}</div>
        </div>
      </div>

      {/* Card Footer */}
      <div className="px-6 py-4 bg-gray-50 rounded-b-lg">
        <div className="flex space-x-3">
          {canStart && (
            <Button
              onClick={handleStart}
              loading={actionLoading === 'start'}
              disabled={actionLoading !== null}
              size="sm"
              className="flex-1"
            >
              <Play className="h-4 w-4 mr-2" />
              Start
            </Button>
          )}
          
          {canStop && (
            <Button
              onClick={handleStop}
              loading={actionLoading === 'stop'}
              disabled={actionLoading !== null}
              variant="outline"
              size="sm"
              className="flex-1"
            >
              <Square className="h-4 w-4 mr-2" />
              Stop
            </Button>
          )}

          {session.status === 'running' && session.container_info?.ports && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                // Open first port in new tab (assuming web service)
                const port = session.container_info!.ports[0];
                window.open(`http://localhost:${port}`, '_blank');
              }}
            >
              <ExternalLink className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default SessionCard;
