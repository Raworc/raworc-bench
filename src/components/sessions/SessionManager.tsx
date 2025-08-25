'use client';

import React, { useState, useEffect } from 'react';
import Button from '@/components/ui/Button';
import SessionCard from './SessionCard';
import CreateSessionModal from './CreateSessionModal';
import { ArrowLeft, Plus, RefreshCw, Play, Square, Activity } from 'lucide-react';
import type { Workspace, Session } from '@/types/api';
import apiClient from '@/lib/api-client';

interface SessionManagerProps {
  workspace: Workspace | null;
  onBack: () => void;
}

/**
 * Session Manager Component
 * 
 * Features:
 * - Display all sessions in a workspace
 * - Create new sessions
 * - Start/stop sessions
 * - Monitor session status
 * - Real-time updates
 */
const SessionManager: React.FC<SessionManagerProps> = ({ workspace, onBack }) => {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Load sessions when workspace changes
  useEffect(() => {
    if (workspace) {
      loadSessions();
    }
  }, [workspace]);

  // Set up polling for session status updates
  useEffect(() => {
    if (!workspace) return;

    const interval = setInterval(() => {
      loadSessions(true); // Silent refresh
    }, 10000); // Poll every 10 seconds

    return () => clearInterval(interval);
  }, [workspace]);

  /**
   * Load sessions from API
   */
  const loadSessions = async (silent = false) => {
    if (!workspace) return;

    try {
      if (!silent) {
        setError(null);
      }
      
      const response = await apiClient.getSessions(workspace.id);
      
      if (response.success && response.data) {
        setSessions(response.data);
      } else {
        if (!silent) {
          setError(response.error?.message || 'Failed to load sessions');
        }
      }
    } catch (err) {
      if (!silent) {
        setError('Failed to load sessions');
      }
    } finally {
      setLoading(false);
    }
  };

  /**
   * Refresh session list
   */
  const handleRefresh = async () => {
    setRefreshing(true);
    await loadSessions();
    setRefreshing(false);
  };

  /**
   * Handle session creation
   */
  const handleSessionCreated = (newSession: Session) => {
    setSessions(prev => [...prev, newSession]);
    setShowCreateModal(false);
  };

  /**
   * Handle session update
   */
  const handleSessionUpdated = (updatedSession: Session) => {
    setSessions(prev => 
      prev.map(session => 
        session.id === updatedSession.id ? updatedSession : session
      )
    );
  };

  /**
   * Handle session deletion
   */
  const handleSessionDeleted = (deletedSessionId: string) => {
    setSessions(prev => 
      prev.filter(session => session.id !== deletedSessionId)
    );
  };

  /**
   * Start all stopped sessions
   */
  const handleStartAll = async () => {
    if (!workspace) return;

    const stoppedSessions = sessions.filter(session => session.status === 'stopped');
    
    for (const session of stoppedSessions) {
      try {
        const response = await apiClient.startSession(workspace.id, session.id);
        if (response.success && response.data) {
          handleSessionUpdated(response.data);
        }
      } catch (error) {
        console.error(`Failed to start session ${session.name}:`, error);
      }
    }
  };

  /**
   * Stop all running sessions
   */
  const handleStopAll = async () => {
    if (!workspace) return;

    const runningSessions = sessions.filter(session => session.status === 'running');
    
    for (const session of runningSessions) {
      try {
        const response = await apiClient.stopSession(workspace.id, session.id);
        if (response.success && response.data) {
          handleSessionUpdated(response.data);
        }
      } catch (error) {
        console.error(`Failed to stop session ${session.name}:`, error);
      }
    }
  };

  // Show workspace selection if no workspace
  if (!workspace) {
    return (
      <div className="text-center py-12">
        <Activity className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No workspace selected</h3>
        <p className="text-gray-600 mb-6">
          Please select a workspace to manage sessions
        </p>
        <Button onClick={onBack} variant="outline">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Workspaces
        </Button>
      </div>
    );
  }

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">Loading sessions...</span>
      </div>
    );
  }

  // Get session status counts
  const statusCounts = sessions.reduce((acc, session) => {
    acc[session.status] = (acc[session.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <Button
            variant="ghost"
            onClick={onBack}
            className="mr-4"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Sessions in {workspace.name}
            </h1>
            <p className="text-gray-600 mt-1">
              Manage containerized sessions and environments
            </p>
          </div>
        </div>
        
        <div className="flex space-x-3">
          <Button 
            variant="outline" 
            onClick={handleRefresh}
            disabled={refreshing}
            size="sm"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          
          {sessions.some(s => s.status === 'stopped') && (
            <Button 
              variant="outline" 
              onClick={handleStartAll}
              size="sm"
            >
              <Play className="h-4 w-4 mr-2" />
              Start All
            </Button>
          )}
          
          {sessions.some(s => s.status === 'running') && (
            <Button 
              variant="outline" 
              onClick={handleStopAll}
              size="sm"
            >
              <Square className="h-4 w-4 mr-2" />
              Stop All
            </Button>
          )}
          
          <Button onClick={() => setShowCreateModal(true)}>
            <Plus className="h-4 w-4 mr-2" />
            New Session
          </Button>
        </div>
      </div>

      {/* Status Summary */}
      {sessions.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white p-4 rounded-lg border">
            <div className="text-sm text-gray-600">Total</div>
            <div className="text-2xl font-bold text-gray-900">{sessions.length}</div>
          </div>
          <div className="bg-white p-4 rounded-lg border">
            <div className="text-sm text-gray-600">Running</div>
            <div className="text-2xl font-bold text-green-600">{statusCounts.running || 0}</div>
          </div>
          <div className="bg-white p-4 rounded-lg border">
            <div className="text-sm text-gray-600">Stopped</div>
            <div className="text-2xl font-bold text-gray-600">{statusCounts.stopped || 0}</div>
          </div>
          <div className="bg-white p-4 rounded-lg border">
            <div className="text-sm text-gray-600">Pending</div>
            <div className="text-2xl font-bold text-yellow-600">{statusCounts.pending || 0}</div>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
          <p className="text-red-600">{error}</p>
        </div>
      )}

      {/* Session Grid */}
      {sessions.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sessions.map((session) => (
            <SessionCard
              key={session.id}
              session={session}
              workspace={workspace}
              onUpdate={handleSessionUpdated}
              onDelete={handleSessionDeleted}
            />
          ))}
        </div>
      ) : (
        // Empty state
        <div className="text-center py-12">
          <Activity className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No sessions found</h3>
          <p className="text-gray-600 mb-6">
            Create your first session to get started
          </p>
          <Button onClick={() => setShowCreateModal(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Create Session
          </Button>
        </div>
      )}

      {/* Create Session Modal */}
      {showCreateModal && (
        <CreateSessionModal
          workspace={workspace}
          onClose={() => setShowCreateModal(false)}
          onSuccess={handleSessionCreated}
        />
      )}
    </div>
  );
};

export default SessionManager;
