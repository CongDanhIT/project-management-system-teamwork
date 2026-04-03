'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Lock, User, UserPlus, ArrowRight, ShieldCheck, Zap, Globe, CheckCircle2, AlertCircle, Sparkles, Layout } from 'lucide-react';
import { authService } from '@/services/auth.service';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';

export default function RegisterPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);

  // Regex chuẩn để kiểm tra định dạng email
  const validateEmail = (email: string) => {
    return String(email)
      .toLowerCase()
      .match(
        /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
      );
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const name = formData.get('name') as string;
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;
    const confirmPassword = formData.get('confirmPassword') as string;

    // 1. Kiểm tra định dạng email
    if (!validateEmail(email)) {
      setError('Địa chỉ email không hợp lệ. Vui lòng kiểm tra lại.');
      setLoading(false);
      return;
    }

    // 2. Kiểm tra mật khẩu xác nhận
    if (password !== confirmPassword) {
      setError('Mật khẩu xác nhận không trùng khớp.');
      setLoading(false);
      return;
    }

    // 3. Kiểm tra độ dài mật khẩu (bảo mật cơ bản)
    if (password.length < 6) {
      setError('Mật khẩu phải có ít nhất 6 ký tự.');
      setLoading(false);
      return;
    }

    try {
      await authService.register({ name, email, password });
      setShowSuccess(true);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Đăng ký thất bại. Email này có thể đã được sử dụng.');
    } finally {
      setLoading(false);
    }
  };

  const handleSuccessRedirect = () => {
    router.push('/login?registered=true');
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
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950 font-sans selection:bg-teal-100 selection:text-teal-900 overflow-hidden relative">
      {/* Success Modal Overlay */}
      <AnimatePresence>
        {showSuccess && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="w-full max-w-md glass-card bg-white dark:bg-slate-900 border border-teal-500/30 rounded-[32px] p-8 shadow-2xl text-center space-y-6"
            >
              <div className="w-20 h-20 bg-teal-100 dark:bg-teal-500/20 rounded-full flex items-center justify-center mx-auto shadow-inner relative overflow-hidden">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 200, damping: 10, delay: 0.2 }}
                >
                  <CheckCircle2 className="w-10 h-10 text-teal-600 dark:text-teal-400" />
                </motion.div>
                <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/20 to-transparent" />
              </div>

              <div className="space-y-2">
                <h3 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center justify-center gap-2">
                  <Sparkles className="w-5 h-5 text-teal-500" />
                  Đăng ký thành công!
                </h3>
                <p className="text-slate-500 dark:text-slate-400 font-medium">
                  Tài khoản của bạn đã được tạo. Hãy tham gia thiết kế quy trình làm việc chuyên nghiệp ngay.
                </p>
              </div>

              <Button
                onClick={handleSuccessRedirect}
                className="w-full h-14 bg-kinetic hover:shadow-xl active:scale-[0.98] transition-all rounded-2xl text-white font-bold text-lg group"
              >
                Xác nhận & Đăng nhập
              </Button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Left Side: Premium Brand Section */}
      <div className="hidden lg:relative lg:flex lg:w-1/2 overflow-hidden items-center justify-center">
        <div className="absolute inset-0 bg-kinetic">
          {/* Static Fallback (Bottom Layer) */}
          <Image
            src="/images/auth/register_bg_v2.png"
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
          <div className="absolute inset-0 bg-gradient-to-tr from-teal-900/80 via-transparent to-indigo-900/50" />
        </div>

        <div className="absolute top-1/4 -left-20 w-96 h-96 bg-teal-400/20 blur-[120px] rounded-full animate-pulse" />
        <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-indigo-500/20 blur-[120px] rounded-full animate-pulse delay-1000" />

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

            <div className="space-y-6">
              <h1 className="text-6xl font-bold text-white leading-[1.1] tracking-tight">
                Design your <br />
                <span className="text-teal-300 italic">perfect</span> workflow.
              </h1>
              <p className="text-xl text-teal-50/70 max-w-lg leading-relaxed">
                Khám phá nền tảng quản trị dự án tập trung vào trải nghiệm người dùng cao cấp và tốc độ xử lý vượt trội.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {[
                { icon: ShieldCheck, text: "Bảo mật chuẩn Enterprise" },
                { icon: Zap, text: "Tốc độ xử lý realtime" },
                { icon: Globe, text: "Làm việc từ bất kỳ đâu" },
                { icon: ArrowRight, text: "Tích hợp AI mạnh mẽ" },
              ].map((feature, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 + i * 0.1 }}
                  className="flex items-center gap-3 p-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/10 hover:bg-white/15 transition-colors cursor-default group"
                >
                  <feature.icon className="w-5 h-5 text-teal-300 group-hover:scale-110 transition-transform" />
                  <span className="text-sm font-medium text-white/90">{feature.text}</span>
                </motion.div>
              ))}
            </div>
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
          <div className="space-y-2 text-left">
            <h2 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">Tạo tài khoản</h2>
            <p className="text-slate-500 dark:text-slate-400 font-medium">
              Cùng xây dựng môi trường làm việc lý tưởng ngay bây giờ.
            </p>
          </div>

          <Card className="border-slate-200/60 dark:border-slate-800 shadow-ambient bg-white dark:bg-slate-900/50 backdrop-blur-sm rounded-3xl p-2 overflow-hidden">
            <CardContent className="pt-6">
              <form onSubmit={handleSubmit} className="space-y-6">
                <AnimatePresence mode="wait">
                  {error && (
                    <motion.div
                      key="error"
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className="p-4 text-sm font-medium text-destructive bg-destructive/10 border border-destructive/20 rounded-2xl flex items-center gap-3 overflow-hidden"
                    >
                      <AlertCircle className="w-5 h-5 flex-shrink-0 animate-bounce" />
                      {error}
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="space-y-4">
                  <motion.div variants={itemVariants} className="space-y-2">
                    <Label htmlFor="name" className="text-sm font-semibold text-slate-700 dark:text-slate-300 ml-1">Họ và tên</Label>
                    <div className="relative group">
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-teal-600 transition-colors" />
                      <Input
                        id="name"
                        name="name"
                        type="text"
                        placeholder="Nguyễn Văn A"
                        autoComplete="name"
                        className="h-12 pl-12 bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 rounded-2xl focus:ring-teal-500/20 focus:border-teal-600 transition-all text-base"
                        required
                      />
                    </div>
                  </motion.div>

                  <motion.div variants={itemVariants} className="space-y-2">
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

                  <motion.div variants={itemVariants} className="space-y-2">
                    <Label htmlFor="password" className="text-sm font-semibold text-slate-700 dark:text-slate-300 ml-1">Mật khẩu</Label>
                    <div className="relative group">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-teal-600 transition-colors" />
                      <Input
                        id="password"
                        name="password"
                        type="password"
                        placeholder="••••••••"
                        autoComplete="new-password"
                        className="h-12 pl-12 bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 rounded-2xl focus:ring-teal-500/20 focus:border-teal-600 transition-all text-base"
                        required
                      />
                    </div>
                  </motion.div>

                  <motion.div variants={itemVariants} className="space-y-2">
                    <Label htmlFor="confirmPassword" className="text-sm font-semibold text-slate-700 dark:text-slate-300 ml-1">Xác nhận mật khẩu</Label>
                    <div className="relative group">
                      <CheckCircle2 className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-teal-600 transition-colors" />
                      <Input
                        id="confirmPassword"
                        name="confirmPassword"
                        type="password"
                        placeholder="••••••••"
                        autoComplete="new-password"
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
                        Đang xử lý...
                      </div>
                    ) : (
                      <div className="flex items-center justify-center gap-3">
                        Đăng ký ngay
                        <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                      </div>
                    )}
                  </Button>
                </motion.div>
              </form>
            </CardContent>

            <CardFooter className="pb-8 flex flex-col space-y-6">
              <div className="w-full h-px bg-slate-100 dark:bg-slate-800 relative">
                <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white dark:bg-slate-900 px-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Hoặc</span>
              </div>

              <div className="flex items-center justify-center gap-2 text-sm">
                <span className="text-slate-500 dark:text-slate-400 font-medium">Bạn đã là thành viên?</span>
                <Link
                  href="/login"
                  className="font-bold text-teal-600 hover:text-teal-700 dark:text-teal-400 hover:underline underline-offset-4 decoration-2 transition-all"
                >
                  Đăng nhập
                </Link>
              </div>
            </CardFooter>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
