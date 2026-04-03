'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Lock, LogIn, Chrome, Layout, ArrowRight, ShieldCheck, Zap, Layers, Sparkles } from 'lucide-react';
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
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950 font-sans selection:bg-teal-100 selection:text-teal-900 overflow-hidden">
      {/* Left Side: Premium Brand Section (Consistent with Register) */}
      <div className="hidden lg:relative lg:flex lg:w-1/2 overflow-hidden items-center justify-center">
        <div className="absolute inset-0 bg-kinetic">
          {/* Static Fallback (Bottom Layer) */}
          <Image
            src="/images/auth/login_bg_v2.png"
            alt="Static Fallback"
            fill
            className="object-cover opacity-40 mix-blend-overlay pointer-events-none"
            priority
          />

          {/* Active Video Background (Top Layer) */}
          <video
            autoPlay
            loop
            muted
            playsInline
            className="absolute inset-0 w-full h-full object-cover opacity-70 mix-blend-overlay"
          >
            <source src="/videos/videochoLogin_register.mp4" type="video/mp4" />
          </video>
          <div className="absolute inset-0 bg-gradient-to-br from-teal-900/80 via-transparent to-indigo-900/50" />
        </div>

        {/* Ambient Effects */}
        <div className="absolute top-1/3 -right-20 w-96 h-96 bg-teal-400/20 blur-[120px] rounded-full animate-pulse" />
        <div className="absolute bottom-1/4 -left-20 w-96 h-96 bg-indigo-500/20 blur-[120px] rounded-full animate-pulse delay-700" />

        <div className="relative z-10 p-16 max-w-2xl">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="space-y-12"
          >
            {/* Logo Section - Premium Gradient Style */}
            <div className="flex items-center gap-4">
              <div className="relative w-14 h-14 bg-gradient-to-br from-teal-500 to-indigo-600 rounded-[20px] flex items-center justify-center shadow-lg shadow-teal-500/20 group overflow-hidden">
                <Layout className="w-7 h-7 text-white" />
                <div className="absolute inset-0 bg-gradient-to-tr from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <div>
                <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-widest uppercase">TeamFlow</h2>
                <p className="text-[10px] font-bold text-teal-600 dark:text-teal-400 tracking-[0.2em] uppercase opacity-80">Enterprise Ready</p>
              </div>
            </div>

            {/* Tagline Section */}
            <div className="space-y-6">
              <h1 className="text-5xl lg:text-6xl font-black text-white leading-[1] tracking-tighter uppercase">
                Work <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-300 to-indigo-300">smarter</span>,<br />
                not harder.
              </h1>
              <p className="text-lg lg:text-xl text-white/60 max-w-lg leading-relaxed font-medium">
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
                <div className="w-12 h-12 bg-teal-500 rounded-2xl flex items-center justify-center shadow-lg shadow-teal-500/20 group-hover:scale-110 transition-transform">
                  <Sparkles className="w-6 h-6 text-white" />
                </div>
                <div className="text-left">
                  <p className="text-teal-400 font-bold text-xs tracking-widest uppercase">Tính năng mới</p>
                  <p className="text-white/80 text-sm font-medium">Tự động hóa quy trình AI đã sẵn sàng.</p>
                </div>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <div className="flex -space-x-3">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="w-9 h-9 rounded-full border-2 border-slate-900/50 bg-white/10 overflow-hidden backdrop-blur-sm">
                      <img src={`https://i.pravatar.cc/150?u=${i + 20}`} alt="User" className="w-full h-full object-cover" />
                    </div>
                  ))}
                  <div className="w-9 h-9 rounded-full border-2 border-slate-900/50 bg-teal-600 flex items-center justify-center text-[10px] font-bold text-white shadow-lg">
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
      <div className="flex-1 flex flex-col justify-center items-center p-8 bg-slate-50 dark:bg-slate-950 relative">
        <div className="lg:hidden absolute top-0 left-0 w-full h-1 bg-kinetic" />

        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="w-full max-w-[440px] space-y-8"
        >
          {/* Header Mobile Only */}
          <div className="mb-10 text-center lg:hidden flex flex-col items-center">
            <div className="w-12 h-12 rounded-xl bg-kinetic flex items-center justify-center mb-4">
              <span className="text-white font-black text-xl">T</span>
            </div>
            <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter">TEAMFLOW</h1>
          </div>

          <div className="space-y-2 text-left">
            <h2 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">Chào mừng quay lại</h2>
            <p className="text-slate-500 dark:text-slate-400 font-medium whitespace-nowrap">
              Đăng nhập để quản lý nhóm và dự án của bạn.
            </p>
          </div>

          <Card className="border-slate-200/60 dark:border-slate-800 shadow-ambient bg-white dark:bg-slate-900/50 backdrop-blur-sm rounded-3xl p-2">
            <CardContent className="pt-6">
              <form onSubmit={handleSubmit} className="space-y-6">
                <AnimatePresence mode="wait">
                  {error && (
                    <motion.div
                      key="error"
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className="p-4 text-sm font-medium text-destructive bg-destructive/10 border border-destructive/20 rounded-2xl flex items-center gap-3"
                    >
                      <div className="w-1.5 h-1.5 rounded-full bg-destructive animate-pulse" />
                      {error}
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="space-y-5">
                  <motion.div variants={itemVariants} className="space-y-2.5">
                    <Label htmlFor="email" className="text-sm font-semibold text-slate-700 dark:text-slate-300 ml-1">Địa chỉ Email</Label>
                    <div className="relative group">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-teal-600 transition-colors" />
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        placeholder="example@teamflow.app"
                        autoComplete="email"
                        className="h-12 pl-12 bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 rounded-2xl focus:ring-teal-500/20 focus:border-teal-600 transition-all text-base"
                        required
                      />
                    </div>
                  </motion.div>

                  <motion.div variants={itemVariants} className="space-y-2.5">
                    <div className="flex items-center justify-between ml-1">
                      <Label htmlFor="password" className="text-sm font-semibold text-slate-700 dark:text-slate-300">Mật khẩu</Label>
                      <Link
                        href="/forgot-password"
                        className="text-xs font-bold text-teal-600 hover:text-teal-700 dark:text-teal-400 transition-colors"
                      >
                        Quên mật khẩu?
                      </Link>
                    </div>
                    <div className="relative group">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-teal-600 transition-colors" />
                      <Input
                        id="password"
                        name="password"
                        type="password"
                        placeholder="••••••••"
                        autoComplete="current-password"
                        className="h-12 pl-12 bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 rounded-2xl focus:ring-teal-500/20 focus:border-teal-600 transition-all text-base"
                        required
                      />
                    </div>
                  </motion.div>
                </div>

                <motion.div variants={itemVariants} className="pt-2">
                  <Button
                    type="submit"
                    className="w-full h-13 bg-kinetic hover:shadow-lg hover:shadow-teal-900/20 active:scale-[0.98] transition-all rounded-2xl text-white font-bold text-lg group"
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
                  <span className="w-full h-px bg-slate-100 dark:bg-slate-800" />
                </div>
                <div className="relative flex justify-center text-[10px] uppercase font-bold tracking-widest">
                  <span className="bg-white dark:bg-slate-900 px-4 text-slate-400">Hoặc tiếp tục với</span>
                </div>
              </div>

              <motion.div variants={itemVariants}>
                <Button
                  variant="outline"
                  className="w-full h-12 bg-white dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 rounded-2xl font-bold shadow-sm hover:shadow-md hover:bg-slate-50 dark:hover:bg-slate-800 transition-all active:scale-[0.98] flex items-center justify-center gap-3"
                  type="button"
                  onClick={handleGoogleLogin}
                >
                  <Chrome className="w-5 h-5 text-[#4285F4]" />
                  Google
                </Button>
              </motion.div>
            </CardContent>

            <CardFooter className="pb-8 flex justify-center pt-8 border-t border-slate-50 dark:border-slate-800">
              <div className="flex items-center gap-2 text-sm">
                <span className="text-slate-500 dark:text-slate-400 font-medium">Bạn chưa là thành viên?</span>
                <Link
                  href="/register"
                  className="font-bold text-teal-600 hover:text-teal-700 dark:text-teal-400 hover:underline underline-offset-4 decoration-2 transition-all"
                >
                  Tạo tài khoản mới
                </Link>
              </div>
            </CardFooter>
          </Card>

          <footer className="pt-8 text-center">
            <p className="text-[11px] text-slate-400 dark:text-slate-600 leading-relaxed uppercase tracking-tighter font-bold">
              © 2024 TeamFlow Inc. Mọi quyền được bảo lưu.
            </p>
          </footer>
        </motion.div>
      </div>
    </div>
  );
}
