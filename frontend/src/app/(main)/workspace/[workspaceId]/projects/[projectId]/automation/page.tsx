"use client";

import React from 'react';
import WorkflowBuilder from '@/pages/Project/Automation/WorkflowBuilder';

export default function AutomationPage({ params }: { params: { workspaceId: string, projectId: string } }) {
  return (
    <div className="h-[calc(100vh-64px)] w-full">
      <WorkflowBuilder />
    </div>
  );
}
