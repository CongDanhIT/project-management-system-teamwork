import { useQuery } from '@tanstack/react-query';
import { useParams } from 'next/navigation';
import { useAuthStore } from '@/stores/auth.store';
import { workspaceService } from '@/services/workspace.service';

export function useWorkspaceRole() {
  const params = useParams();
  const { user } = useAuthStore();
  const workspaceId = params.workspaceId as string;

  const { data: membersData, isLoading } = useQuery({
    queryKey: ['workspace-members', workspaceId],
    queryFn: () => workspaceService.getMembers(workspaceId),
    enabled: !!workspaceId && !!user,
  });

  const currentMember = membersData?.members?.find((m: any) => 
    (m.userId?._id === user?.id) || (typeof m.userId === 'string' && m.userId === user?.id)
  );
  
  const roleName = currentMember?.role?.name || 'MEMBER';
  const isAdminOrOwner = roleName === 'OWNER' || roleName === 'ADMIN';

  return {
    roleName,
    isAdminOrOwner,
    isLoading,
    workspaceId
  };
}
