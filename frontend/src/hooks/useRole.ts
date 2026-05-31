import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { workspaceService } from '@/services/workspace.service';
import { useAuthStore } from '@/stores/auth.store';
import { RoleEnum } from '@/types/role';

export const useRole = () => {
    const params = useParams();
    const workspaceId = params?.workspaceId as string;
    const { user: currentUser } = useAuthStore();

    const { data } = useQuery({
        queryKey: ['workspace-members', workspaceId],
        queryFn: () => workspaceService.getMembers(workspaceId),
        enabled: !!workspaceId,
        staleTime: 1000 * 60 * 5, // 5 minutes
    });

    const members = data?.members || [];
    const currentUserMember = members.find((m: any) => m.userId?._id === currentUser?.id);
    const role = currentUserMember?.role?.name as RoleEnum | undefined;

    const isOwner = role === RoleEnum.OWNER;
    const isAdmin = role === RoleEnum.ADMIN;
    const isMember = role === RoleEnum.MEMBER;
    const isPrivileged = isOwner || isAdmin;

    return {
        role,
        isOwner,
        isAdmin,
        isMember,
        isPrivileged,
        isLoading: !data,
    };
};
