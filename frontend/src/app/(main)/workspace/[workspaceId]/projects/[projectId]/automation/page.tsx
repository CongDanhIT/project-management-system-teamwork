"use client";

import React from 'react';
import { useRouter } from 'next/navigation';
import WorkflowBuilder from '@/pages/Project/Automation/WorkflowBuilder';
import { useWorkspaceRole } from '@/hooks/useWorkspaceRole';
import Loader from '@/components/ui/Loader';

export default function AutomationPage({ params }: { params: { workspaceId: string, projectId: string } }) {
  const router = useRouter();
  const { workspaceId } = params;
  const { isAdminOrOwner, isLoading } = useWorkspaceRole();

  React.useEffect(() => {
    if (!isLoading && !isAdminOrOwner) {
      router.replace(`/workspace/${workspaceId}`);
    }
  }, [isAdminOrOwner, isLoading, router, workspaceId]);

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader size="lg" />
      </div>
    );
  }

  if (!isAdminOrOwner) {
    return null;
  }

  return (
    <div className="h-[calc(100vh-64px)] w-full">
      <WorkflowBuilder />
    </div>
  );
}
