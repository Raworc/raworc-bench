'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import WorkspaceList from '@/components/workspaces/WorkspaceList';
import SessionManager from '@/components/sessions/SessionManager';
import Button from '@/components/ui/Button';
import { 
  LogOut, 
  Settings, 
  Server, 
  Users, 
  FolderOpen, 
  Play,
  Activity,
  Database 
} from 'lucide-react';
import type { Workspace, Session } from '@/types/api';
import apiClient from '@/lib/api-client';

/**
 * Main Dashboard Component
 * 
 * Features:
 * - User info and logout
 * - Workspace management
 * - Session overview
 * - System status
 * - Navigation between sections
 */
const Dashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<'workspaces' | 'sessions' | 'settings'>('workspaces');
  const [selectedWorkspace, setSelectedWorkspace] = useState<Workspace | null>(null);
  const [systemStatus, setSystemStatus] = useState<{
    healthy: boolean;
    version: string;
    workspaceCount: number;
    sessionCount: number;
  } | null>(null);

  // Load system status on mount
  useEffect(() => {
    loadSystemStatus();
  }, []);

  /**
   * Load system information
   */
  const loadSystemStatus = async () => {
    try {
      const [healthResponse, versionResponse, workspacesResponse] = await Promise.all([
        apiClient.healthCheck(),
        apiClient.getVersion(),
        apiClient.getWorkspaces(),
      ]);

      let sessionCount = 0;
      if (workspacesResponse.success && workspacesResponse.data) {
        // Count sessions across all workspaces
        const sessionPromises = workspacesResponse.data.map(workspace =>
          apiClient.getSessions(workspace.id)
        );
        const sessionResponses = await Promise.all(sessionPromises);
        sessionCount = sessionResponses.reduce((total, response) => {
          return total + (response.success && response.data ? response.data.length : 0);
        }, 0);
      }

      setSystemStatus({
        healthy: healthResponse.success,
        version: versionResponse.success && versionResponse.data ? versionResponse.data.version : 'Unknown',
        workspaceCount: workspacesResponse.success && workspacesResponse.data ? workspacesResponse.data.length : 0,
        sessionCount,
      });
    } catch (error) {
      console.error('Failed to load system status:', error);
    }
  };

  /**
   * Handle workspace selection
   */
  const handleWorkspaceSelect = (workspace: Workspace) => {
    setSelectedWorkspace(workspace);
    setActiveTab('sessions');
  };

  /**
   * Handle logout
   */
  const handleLogout = () => {
    logout();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo and Title */}
            <div className="flex items-center">
              <div className="flex-shrink-0 flex items-center">
                <Server className="h-8 w-8 text-blue-600 mr-3" />
                <h1 className="text-xl font-bold text-gray-900">Raworc Bench</h1>
              </div>
              
              {/* System Status */}
              {systemStatus && (
                <div className="ml-8 flex items-center space-x-4 text-sm">
                  <div className="flex items-center">
                    <div className={`w-2 h-2 rounded-full mr-2 ${
                      systemStatus.healthy ? 'bg-green-500' : 'bg-red-500'
                    }`} />
                    <span className="text-gray-600">
                      {systemStatus.healthy ? 'Healthy' : 'Unhealthy'}
                    </span>
                  </div>
                  <div className="text-gray-400">v{systemStatus.version}</div>
                </div>
              )}
            </div>

            {/* User Menu */}
            <div className="flex items-center space-x-4">
              {/* System Stats */}
              {systemStatus && (
                <div className="hidden md:flex items-center space-x-4 text-sm text-gray-600">
                  <div className="flex items-center">
                    <FolderOpen className="h-4 w-4 mr-1" />
                    {systemStatus.workspaceCount} workspaces
                  </div>
                  <div className="flex items-center">
                    <Play className="h-4 w-4 mr-1" />
                    {systemStatus.sessionCount} sessions
                  </div>
                </div>
              )}

              {/* User Info */}
              <div className="flex items-center">
                <Users className="h-5 w-5 text-gray-400 mr-2" />
                <span className="text-sm font-medium text-gray-700">
                  {user?.username || 'User'}
                </span>
              </div>

              {/* Logout Button */}
              <Button
                variant="outline"
                size="sm"
                onClick={handleLogout}
                className="flex items-center"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <nav className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8">
            <button
              onClick={() => setActiveTab('workspaces')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'workspaces'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <FolderOpen className="h-4 w-4 inline mr-2" />
              Workspaces
            </button>
            
            <button
              onClick={() => setActiveTab('sessions')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'sessions'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Activity className="h-4 w-4 inline mr-2" />
              Sessions
              {selectedWorkspace && (
                <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                  {selectedWorkspace.name}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('settings')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'settings'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Settings className="h-4 w-4 inline mr-2" />
              Settings
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'workspaces' && (
          <WorkspaceList 
            onWorkspaceSelect={handleWorkspaceSelect}
            onWorkspaceChange={loadSystemStatus}
          />
        )}
        
        {activeTab === 'sessions' && (
          <SessionManager 
            workspace={selectedWorkspace}
            onBack={() => setActiveTab('workspaces')}
          />
        )}
        
        {activeTab === 'settings' && (
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Settings</h2>
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium text-gray-700">API Configuration</h3>
                <p className="text-sm text-gray-500 mt-1">
                  Base URL: {apiClient.getBaseURL()}
                </p>
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-gray-700">User Information</h3>
                <div className="mt-1 text-sm text-gray-500">
                  <p>Username: {user?.username}</p>
                  <p>Email: {user?.email || 'Not provided'}</p>
                  <p>Roles: {user?.roles.join(', ') || 'None'}</p>
                </div>
              </div>

              {systemStatus && (
                <div>
                  <h3 className="text-sm font-medium text-gray-700">System Status</h3>
                  <div className="mt-1 text-sm text-gray-500">
                    <p>Version: {systemStatus.version}</p>
                    <p>Health: {systemStatus.healthy ? 'Healthy' : 'Unhealthy'}</p>
                    <p>Workspaces: {systemStatus.workspaceCount}</p>
                    <p>Sessions: {systemStatus.sessionCount}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default Dashboard;
