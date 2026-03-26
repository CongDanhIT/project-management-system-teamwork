'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Mail, Lock, LogIn, Chrome } from 'lucide-react';
import { useAuthStore } from '@/stores/auth.store';
import { authService } from '@/services/auth.service';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';

export default function LoginPage() {
  const router = useRouter();
  const setAuth = useAuthStore((state) => state.setAuth);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    try {
      const response = await authService.login({ email, password });
      setAuth(response.user);
      
      if (response.user.currentWorkspace) {
        router.push(`/workspace/${response.user.currentWorkspace}`);
      } else {
        router.push('/onboarding');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Đăng nhập thất bại. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    // Chuyển hướng đến endpoint Google Auth của Backend
    window.location.href = `http://localhost:8000/api/auth/google`;
  };

  return (
    <div className="flex min-h-screen">
      {/* Left Side - Tagline */}
      <div className="hidden lg:flex lg:w-1/2 bg-indigo-50/50 dark:bg-slate-900 justify-center items-center p-12">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
          className="max-w-md"
        >
          <h1 className="text-5xl font-bold text-indigo-600 dark:text-indigo-400 leading-tight mb-6">
            Manage your team flow with ease.
          </h1>
          <p className="text-lg text-slate-600 dark:text-slate-400">
            Hợp tác, quản lý dự án và theo dõi tiến độ công việc một cách chuyên nghiệp và hiệu quả nhất.
          </p>
        </motion.div>
      </div>

      {/* Right Side - Form */}
      <div className="flex-1 flex flex-col justify-center items-center p-6 bg-background">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md"
        >
          <div className="mb-8 text-center lg:hidden">
            <h1 className="text-3xl font-bold text-indigo-600 dark:text-indigo-400">TeamFlow</h1>
          </div>

          <Card className="glass shadow-glass border-none">
            <CardHeader className="space-y-1">
              <CardTitle className="text-2xl font-bold tracking-tight">Chào mừng trở lại</CardTitle>
              <CardDescription>
                Đăng nhập vào tài khoản của bạn để tiếp tục
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                  <div className="p-3 text-sm text-red-500 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
                    {error}
                  </div>
                )}
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      placeholder="name@company.com"
                      className="pl-10"
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password">Mật khẩu</Label>
                    <Link
                      href="/forgot-password"
                      className="text-xs font-medium text-indigo-600 hover:text-indigo-500"
                    >
                      Quên mật khẩu?
                    </Link>
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="password"
                      name="password"
                      type="password"
                      className="pl-10"
                      required
                    />
                  </div>
                </div>
                <Button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700" disabled={loading}>
                  {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
                  {!loading && <LogIn className="ml-2 h-4 w-4" />}
                </Button>
              </form>

              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-slate-200 dark:border-slate-800" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-transparent px-2 text-muted-foreground">
                    Hoặc tiếp tục với
                  </span>
                </div>
              </div>

              <Button 
                variant="outline" 
                className="w-full bg-white dark:bg-transparent" 
                type="button"
                onClick={handleGoogleLogin}
              >
                <Chrome className="mr-2 h-4 w-4" />
                Google
              </Button>
            </CardContent>
            <CardFooter className="flex flex-wrap items-center justify-center gap-1 text-sm text-muted-foreground">
              Chưa có tài khoản?{' '}
              <Link
                href="/register"
                className="font-medium text-indigo-600 hover:text-indigo-500 underline-offset-4 hover:underline"
              >
                Đăng ký ngay
              </Link>
            </CardFooter>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
