'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { workspaceService } from '@/services/workspace.service';
import { toast } from 'sonner';
import { Loader2, Hash } from 'lucide-react';

interface JoinWorkspaceModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function JoinWorkspaceModal({ isOpen, onClose }: JoinWorkspaceModalProps) {
  const [inviteCode, setInviteCode] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteCode.trim()) return;

    setLoading(true);
    try {
      const response = await workspaceService.joinWorkspace(inviteCode.trim());
      toast.success('Tham gia workspace thành công!');
      onClose();
      setInviteCode('');
      // Redirect to the joined workspace dashboard
      if (response.workspaceId) {
        router.push(`/workspace/${response.workspaceId}`);
      } else {
        window.location.reload();
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Không thể tham gia workspace. Vui lòng kiểm tra lại mã mời.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px] rounded-3xl border-none shadow-2xl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-black text-slate-900 tracking-tight">Tham gia Workspace</DialogTitle>
          <DialogDescription className="text-slate-500 font-medium pt-1">
            Nhập mã mời được chủ sở hữu Workspace chia sẻ để bắt đầu cộng tác ngay.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleJoin} className="space-y-6 pt-4">
          <div className="space-y-3">
            <Label htmlFor="inviteCode" className="text-sm font-bold text-slate-700 ml-1">Mã mời</Label>
            <div className="relative group">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors">
                <Hash className="w-5 h-5" />
              </div>
              <Input
                id="inviteCode"
                placeholder="Nhập mã mời (VD: E5B23890)"
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value)}
                className="pl-12 h-14 bg-slate-50 border-slate-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 rounded-2xl text-lg font-mono font-bold tracking-widest placeholder:font-sans placeholder:font-medium placeholder:tracking-normal"
                required
              />
            </div>
          </div>
          
          <DialogFooter className="gap-3 pt-2">
            <Button 
              type="button" 
              variant="ghost" 
              onClick={onClose}
              className="font-bold rounded-2xl h-12 hover:bg-slate-100"
            >
              Hủy
            </Button>
            <Button 
              type="submit" 
              disabled={loading || !inviteCode.trim()}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-2xl h-12 flex-1 shadow-lg shadow-indigo-200 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Đang xử lý...
                </>
              ) : (
                'Tham gia ngay'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
