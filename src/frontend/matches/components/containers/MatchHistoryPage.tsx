'use client';

import React, { Suspense } from 'react';

import { MatchHistoryContent, useMatchHistoryPageState } from './MatchHistoryPageSections';

export const MatchHistoryPage: React.FC = () => {
  const state = useMatchHistoryPageState();

  return (
    <div className="h-full">
      <Suspense fallback={<div>Loading...</div>}>
        <MatchHistoryContent {...state} onAddMatch={() => state.setShowAddMatchForm(true)} />
      </Suspense>
    </div>
  );
};


