import { useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useAuthStore } from '@/stores/auth.store';
import { userService } from '@/services/user.service';

/**
 * Hook tự động đồng bộ hóa currentWorkspaceId của User lên backend
 * khi truy cập vào một không gian làm việc cụ thể qua URL.
 */
export const useWorkspaceSync = () => {
  const params = useParams();
  const { user, updateUser } = useAuthStore();
  const workspaceId = params.workspaceId as string;

  useEffect(() => {
    // Chỉ thực hiện nếu có workspaceId hợp lệ và user đang đăng nhập
    const isValidId = workspaceId && /^[0-9a-fA-F]{24}$/.test(workspaceId);

    if (isValidId && user) {
      // Nếu workspaceId từ URL khác với currentWorkspaceId trong store
      if (workspaceId !== user.currentWorkspaceId) {
        // Cập nhật local store ngay lập tức để UI mượt mà
        updateUser({ currentWorkspaceId: workspaceId });

        // Cập nhật backend (silent update)
        userService.switchWorkspace(workspaceId).catch((err) => {
          console.error('Failed to sync current workspace to backend:', err);
        });
      }
    }
  }, [workspaceId, user, updateUser]);
};
