'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Layout, ArrowRight, Building2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { workspaceService } from '@/services/workspace.service';
import { useQueryClient } from '@tanstack/react-query';

export default function OnboardingPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const name = formData.get('name') as string;
    const description = formData.get('description') as string;

    try {
      const workspace = await workspaceService.createWorkspace({ name, description });
      // Clear cache to refresh sidebar/header workspace list
      await queryClient.invalidateQueries({ queryKey: ['workspaces'] });
      // Redirect to the newly created workspace dashboard
      router.push(`/workspace/${workspace._id}`);
    } catch (err: any) {
      console.error('Error creating workspace:', err);
      const errorMessage = err.response?.data?.message || err.message || 'Không thể tạo Workspace. Vui lòng thử lại.';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-indigo-50/30 dark:bg-slate-950 p-6">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <div className="flex justify-center mb-8">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center">
              <Layout className="text-white w-6 h-6" />
            </div>
            <span className="text-2xl font-bold text-slate-900 dark:text-white">TeamFlow</span>
          </div>
        </div>

        <Card className="glass shadow-glass border-none">
          <CardHeader>
            <CardTitle className="text-2xl font-bold">Thiết lập Workspace</CardTitle>
            <CardDescription>
              Workspace là nơi nhóm bạn cộng tác và quản lý dự án.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form id="onboarding-form" onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="p-3 text-sm text-red-500 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
                  {error}
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="name">Tên Workspace</Label>
                <div className="relative">
                  <Building2 className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="name"
                    name="name"
                    placeholder="Ví dụ: Công ty Công nghệ ABC"
                    className="pl-10 h-11"
                    required
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Bạn có thể thay đổi tên này bất cứ lúc nào trong phần cài đặt.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Mô tả (Tùy chọn)</Label>
                <Textarea
                  id="description"
                  name="description"
                  placeholder="Nhập mô tả về mục tiêu hoặc lĩnh vực của nhóm bạn..."
                  className="resize-none h-24"
                />
              </div>
            </form>
          </CardContent>
          <CardFooter>
            <Button
              form="onboarding-form"
              type="submit"
              className="w-full h-11 bg-indigo-600 hover:bg-indigo-700 font-semibold"
              disabled={loading}
            >
              {loading ? 'Đang tạo...' : 'Bắt đầu ngay'}
              {!loading && <ArrowRight className="ml-2 h-4 w-4" />}
            </Button>
          </CardFooter>
        </Card>
      </motion.div>
    </div>
  );
}
