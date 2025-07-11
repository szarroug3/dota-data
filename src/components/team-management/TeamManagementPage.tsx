'use client';

import React, { Suspense } from 'react';

import { ErrorBoundary } from '@/components/layout/ErrorBoundary';
import { Header } from '@/components/layout/Header';
import { LoadingSkeleton } from '@/components/layout/LoadingSkeleton';
import { Sidebar } from '@/components/layout/Sidebar';

import { AddTeamForm } from './AddTeamForm';
import { TeamList } from './TeamList';

export const TeamManagementPage: React.FC = () => {
  return (
    <ErrorBoundary>
      <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
        <Sidebar />
        <div className="flex-1 flex flex-col overflow-hidden">
          <Header 
            title="Team Management" 
            subtitle="Add, manage, and switch between teams"
          />
          <main className="flex-1 overflow-y-auto p-6">
            <div className="max-w-4xl mx-auto">
              {/* Add Team Form */}
              <div className="mb-8">
                <AddTeamForm />
              </div>
              
              {/* Teams List */}
              <Suspense fallback={<LoadingSkeleton type="text" lines={5} />}>
                <TeamList />
              </Suspense>
            </div>
          </main>
        </div>
      </div>
    </ErrorBoundary>
  );
}; 