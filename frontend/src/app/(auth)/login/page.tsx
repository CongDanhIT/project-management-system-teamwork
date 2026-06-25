'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Lock, Chrome, Layout, ArrowRight, Sparkles } from 'lucide-react';
import { useAuthStore } from '@/stores/auth.store';
import { authService } from '@/services/auth.service';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardFooter } from '@/components/ui/card';

export default function LoginPage() {
  const router = useRouter();
  const { user, isAuthenticated, isInitializing, setAuth } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  // Auto redirect nếu đã đăng nhập
  React.useEffect(() => {
    if (!mounted) return;
    if (!isInitializing && isAuthenticated && user) {
      if (user.currentWorkspaceId) {
        router.replace(`/workspace/${user.currentWorkspaceId}`);
      } else {
        router.replace('/onboarding');
      }
    }
  }, [isAuthenticated, isInitializing, user, router, mounted]);

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
    window.location.href = `http://localhost:8000/api/auth/google`;
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <div className="flex min-h-screen bg-[#F7F9FB] dark:bg-[#04100E] font-sans selection:bg-teal-100 selection:text-teal-900 overflow-hidden">
      {/* Left Side: Premium Brand Section */}
      <div className="hidden lg:relative lg:flex lg:w-1/2 overflow-hidden items-center justify-center">
        <div className="absolute inset-0 bg-[#035D5B]">
          {/* Static Fallback */}
          <Image
            src="/images/auth/login_bg_v2.png"
            alt="Static Fallback"
            fill
            className="object-cover opacity-40 mix-blend-overlay pointer-events-none"
            priority
          />

          {/* Active Video Background - KEPT UNCHANGED */}
          <video
            autoPlay
            loop
            muted
            playsInline
            className="absolute inset-0 w-full h-full object-cover opacity-70 mix-blend-overlay"
          >
            <source src="/videos/videochoLogin_register.mp4" type="video/mp4" />
          </video>
          <div className="absolute inset-0 bg-gradient-to-br from-[#035D5B]/80 via-transparent to-[#035D5B]/40" />
        </div>

        {/* Ambient Effects */}
        <div className="absolute top-1/3 -right-20 w-96 h-96 bg-teal-400/20 blur-[120px] rounded-full animate-pulse" />
        <div className="absolute bottom-1/4 -left-20 w-96 h-96 bg-[#035D5B]/20 blur-[120px] rounded-full animate-pulse delay-700" />

        <div className="relative z-10 p-16 max-w-2xl">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="space-y-12"
          >
            {/* Logo Section */}
            <div className="flex items-center gap-2">
              <img 
                src="/logos/logo thương hiệu.svg" 
                alt="TeamFlow Logo" 
                className="w-20 h-20 object-contain -my-4 z-10 transition-transform hover:scale-105 drop-shadow-lg" 
              />
              <div>
                <h2 className="text-3xl font-black text-white tracking-widest uppercase">TeamFlow</h2>
                <p className="text-[10px] font-bold text-[#C7F964] tracking-[0.2em] uppercase opacity-80">Enterprise Ready</p>
              </div>
            </div>

            {/* Tagline Section */}
            <div className="space-y-6">
              <h1 className="text-5xl lg:text-[3.5rem] font-black text-white leading-[1.1] tracking-[-0.02em] uppercase">
                Work <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#C7F964] to-[#A8EFEC]">smarter</span>,<br />
                not harder.
              </h1>
              <p className="text-lg lg:text-xl text-white/70 max-w-lg leading-relaxed font-medium">
                Chào mừng bạn trở lại không gian làm việc tối giản và hiệu quả. Mọi dự án đều nằm trong tầm kiểm soát.
              </p>
            </div>

            {/* Small Proof Card */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="flex flex-col gap-6 bg-white/5 backdrop-blur-3xl border border-white/10 p-6 rounded-[32px] shadow-2xl group hover:bg-white/10 transition-all duration-500 max-w-sm"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-[#035D5B] rounded-2xl flex items-center justify-center shadow-lg shadow-teal-900/20 group-hover:scale-110 transition-transform">
                  <Sparkles className="w-6 h-6 text-[#C7F964]" />
                </div>
                <div className="text-left">
                  <p className="text-[#C7F964] font-bold text-xs tracking-widest uppercase">Tính năng mới</p>
                  <p className="text-white/80 text-sm font-medium">Tự động hóa quy trình AI đã sẵn sàng.</p>
                </div>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <div className="flex -space-x-3">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="w-9 h-9 rounded-full border-2 border-white/10 bg-white/10 overflow-hidden backdrop-blur-sm">
                      <img src={`https://i.pravatar.cc/150?u=${i + 20}`} alt="User" className="w-full h-full object-cover" />
                    </div>
                  ))}
                  <div className="w-9 h-9 rounded-full border-2 border-white/10 bg-[#035D5B] flex items-center justify-center text-[10px] font-bold text-[#C7F964] shadow-lg">
                    +12
                  </div>
                </div>
                <p className="text-white/40 text-[11px] font-medium tracking-tight">Tham gia cùng 2,000+ người dùng</p>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </div>

      {/* Right Side: Form Section */}
      <div className="flex-1 flex flex-col justify-center items-center p-8 bg-[#F7F9FB] dark:bg-[#04100E] relative">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="w-full max-w-[440px] space-y-8"
        >
          <div className="mb-10 text-center lg:hidden flex flex-col items-center">
            <img 
              src="/logos/logo thương hiệu.svg" 
              alt="TeamFlow Logo" 
              className="w-24 h-24 object-contain -my-4 mb-2 drop-shadow-xl" 
            />
            <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter">TEAMFLOW</h1>
          </div>

          <div className="space-y-2 text-left">
            <h2 className="text-[2.25rem] font-black text-[#191C1E] dark:text-[#E5F4EF] leading-tight tracking-[-0.015em]">Chào mừng quay lại</h2>
            <p className="text-[#3F4948] dark:text-slate-400 font-medium text-[1rem]">
              Đăng nhập để quản lý nhóm và dự án của bạn.
            </p>
          </div>

          <Card className="border-none shadow-[0px_20px_40px_rgba(25,28,30,0.06)] bg-white/70 dark:bg-[#172925]/70 backdrop-blur-[16px] rounded-[2rem] overflow-hidden">
            <CardContent className="pt-8 px-8 pb-0">
              <form onSubmit={handleSubmit} className="space-y-6">
                <AnimatePresence mode="wait">
                  {error && (
                    <motion.div
                      key="error"
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className="p-4 text-sm font-medium text-[#BE123C] bg-[#BE123C]/5 rounded-2xl flex items-center gap-3"
                    >
                      <div className="w-1.5 h-1.5 rounded-full bg-[#BE123C] animate-pulse" />
                      {error}
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="space-y-5">
                  <motion.div variants={itemVariants} className="space-y-2.5">
                    <Label htmlFor="email" className="text-[0.75rem] font-semibold text-[#3F4948] dark:text-slate-300 ml-1 uppercase tracking-wider">Địa chỉ Email</Label>
                    <div className="relative group">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-[#035D5B] transition-colors" />
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        placeholder="example@teamflow.app"
                        autoComplete="email"
                        className="h-12 pl-12 bg-[#F2F4F6] dark:bg-[#071613] border-none rounded-2xl focus:ring-2 focus:ring-[#035D5B]/20 focus:bg-white transition-all text-[0.875rem]"
                        required
                      />
                    </div>
                  </motion.div>

                  <motion.div variants={itemVariants} className="space-y-2.5">
                    <div className="flex items-center justify-between ml-1">
                      <Label htmlFor="password" className="text-[0.75rem] font-semibold text-[#3F4948] dark:text-slate-300 uppercase tracking-wider">Mật khẩu</Label>
                      <Link
                        href="/forgot-password"
                        className="text-[0.75rem] font-bold text-[#035D5B] hover:text-[#004442] dark:text-teal-400 transition-colors"
                      >
                        Quên mật khẩu?
                      </Link>
                    </div>
                    <div className="relative group">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-[#035D5B] transition-colors" />
                      <Input
                        id="password"
                        name="password"
                        type="password"
                        placeholder="••••••••"
                        autoComplete="current-password"
                        className="h-12 pl-12 bg-[#F2F4F6] dark:bg-[#071613] border-none rounded-2xl focus:ring-2 focus:ring-[#035D5B]/20 focus:bg-white transition-all text-[0.875rem]"
                        required
                      />
                    </div>
                  </motion.div>
                </div>

                <motion.div variants={itemVariants} className="pt-2">
                  <Button
                    type="submit"
                    className="w-full h-14 bg-gradient-to-r from-[#035D5B] to-[#004442] hover:shadow-xl hover:shadow-[#035D5B]/30 active:scale-[0.98] transition-all rounded-full text-white font-bold text-[0.875rem] group"
                    disabled={loading}
                  >
                    {loading ? (
                      <div className="flex items-center gap-2">
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Đang đăng nhập...
                      </div>
                    ) : (
                      <div className="flex items-center justify-center gap-3">
                        Đăng nhập
                        <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                      </div>
                    )}
                  </Button>
                </motion.div>
              </form>

              <div className="relative my-8">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full h-px bg-[#F2F4F6] dark:bg-slate-800" />
                </div>
                <div className="relative flex justify-center text-[0.6875rem] uppercase font-bold tracking-[0.05em]">
                  <span className="bg-transparent px-4 text-slate-400 backdrop-blur-sm">Hoặc tiếp tục với</span>
                </div>
              </div>

              <motion.div variants={itemVariants} className="pb-8">
                <Button
                  variant="outline"
                  className="w-full h-14 bg-white/50 dark:bg-slate-800/50 border-[#F2F4F6] dark:border-slate-700 rounded-full font-bold shadow-sm hover:shadow-md hover:bg-white dark:hover:bg-slate-800 transition-all active:scale-[0.98] flex items-center justify-center gap-3 text-[0.875rem]"
                  type="button"
                  onClick={handleGoogleLogin}
                >
                  <Chrome className="w-5 h-5 text-[#4285F4]" />
                  Google
                </Button>
              </motion.div>
            </CardContent>

            <CardFooter className="pb-8 flex justify-center pt-8 border-t border-[#F2F4F6] dark:border-slate-800">
              <div className="flex items-center gap-2 text-[0.875rem]">
                <span className="text-[#3F4948] dark:text-slate-400 font-medium">Bạn chưa là thành viên?</span>
                <Link
                  href="/register"
                  className="font-bold text-[#035D5B] hover:text-[#004442] dark:text-teal-400 hover:underline underline-offset-4 decoration-2 transition-all"
                >
                  Tạo tài khoản mới
                </Link>
              </div>
            </CardFooter>
          </Card>

          <footer className="pt-8 text-center">
            <p className="text-[0.6875rem] text-slate-400 dark:text-slate-600 leading-relaxed uppercase tracking-[0.05em] font-bold">
              © 2024 TeamFlow Inc. Mọi quyền được bảo lưu.
            </p>
          </footer>
        </motion.div>
      </div>
    </div>
  );
}
