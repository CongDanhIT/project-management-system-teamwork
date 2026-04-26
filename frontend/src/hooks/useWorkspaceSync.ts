import { useEffect, useRef } from 'react';
import { useParams } from 'next/navigation';
import { useAuthStore } from '@/stores/auth.store';
import { userService } from '@/services/user.service';

/**
 * Hook tự động đồng bộ hóa currentWorkspaceId của User lên backend
 * khi truy cập vào một không gian làm việc cụ thể qua URL.
 * Đã được tối ưu để tránh loop và trigger dư thừa.
 */
export const useWorkspaceSync = () => {
  const params = useParams();
  const { user, updateUser } = useAuthStore();
  const workspaceId = params.workspaceId as string;
  const lastSyncedId = useRef<string | null>(null);

  useEffect(() => {
    // Chỉ thực hiện nếu có workspaceId hợp lệ (24 ký tự hex) và user đang đăng nhập
    const isValidId = workspaceId && /^[0-9a-fA-F]{24}$/.test(workspaceId);

    if (isValidId && user) {
      // Chỉ đồng bộ nếu ID khác với currentWorkspaceId TRONG STORE và chưa sync ID này gần đây
      if (workspaceId !== user.currentWorkspaceId && lastSyncedId.current !== workspaceId) {
        console.log(`[useWorkspaceSync] Đồng bộ workspace mới: ${workspaceId}`);
        
        lastSyncedId.current = workspaceId;

        // Cập nhật local store ngay lập tức để UI mượt mà
        updateUser({ currentWorkspaceId: workspaceId });

        // Cập nhật backend (silent update)
        userService.switchWorkspace(workspaceId).catch((err) => {
          console.error('[useWorkspaceSync] Lỗi khi đồng bộ workspace lên backend:', err);
        });
      }
    }
  }, [workspaceId, user?.id, user?.currentWorkspaceId, updateUser]);
};
