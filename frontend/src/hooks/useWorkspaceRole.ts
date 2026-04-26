import { useQuery } from '@tanstack/react-query';
import { useParams } from 'next/navigation';
import { useAuthStore } from '@/stores/auth.store';
import { workspaceService } from '@/services/workspace.service';

export function useWorkspaceRole() {
  const params = useParams();
  const { user } = useAuthStore();
  
  // Lấy workspaceId ổn định hơn
  const workspaceId = (params?.workspaceId as string) || 
    (typeof window !== 'undefined' ? window.location.pathname.split('/')[2] : '');
  
  const isValidId = /^[0-9a-fA-F]{24}$/.test(workspaceId);

  const { data: membersData, isLoading } = useQuery({
    queryKey: ['workspace-members', workspaceId],
    queryFn: () => workspaceService.getMembers(workspaceId),
    enabled: isValidId && !!user,
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
