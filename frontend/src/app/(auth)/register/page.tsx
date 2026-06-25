'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Lock, User, ArrowRight, CheckCircle2, AlertCircle, Sparkles, Layout, Zap, Globe, ShieldCheck } from 'lucide-react';
import { authService } from '@/services/auth.service';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardFooter } from '@/components/ui/card';

export default function RegisterPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);

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

    if (!validateEmail(email)) {
      setError('Địa chỉ email không hợp lệ.');
      setLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      setError('Mật khẩu xác nhận không trùng khớp.');
      setLoading(false);
      return;
    }

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
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <div className="flex min-h-screen bg-[#F7F9FB] dark:bg-[#04100E] font-sans selection:bg-teal-100 selection:text-teal-900 overflow-hidden relative">
      {/* Success Modal Overlay */}
      <AnimatePresence>
        {showSuccess && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="w-full max-w-md bg-white/90 dark:bg-[#172925]/90 border-none backdrop-blur-2xl rounded-[2.5rem] p-10 shadow-2xl text-center space-y-8"
            >
              <div className="w-20 h-20 bg-[#C7F964]/10 rounded-full flex items-center justify-center mx-auto relative overflow-hidden">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 200, damping: 10, delay: 0.2 }}
                >
                  <CheckCircle2 className="w-10 h-10 text-[#035D5B] dark:text-[#C7F964]" />
                </motion.div>
              </div>

              <div className="space-y-3">
                <h3 className="text-[2rem] font-black text-[#191C1E] dark:text-[#E5F4EF] leading-tight tracking-tight">
                  Thành công!
                </h3>
                <p className="text-[#3F4948] dark:text-slate-400 font-medium text-[1rem]">
                  Tài khoản của bạn đã được tạo. Hãy tham gia thiết kế quy trình làm việc chuyên nghiệp ngay.
                </p>
              </div>

              <Button
                onClick={handleSuccessRedirect}
                className="w-full h-14 bg-gradient-to-r from-[#035D5B] to-[#004442] shadow-lg shadow-[#035D5B]/20 hover:shadow-xl active:scale-[0.98] transition-all rounded-full text-white font-bold text-[1rem] group"
              >
                Tiếp tục đến Đăng nhập
              </Button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Left Side: Premium Brand Section - Hidden on Mobile */}
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

          {/* Active Video Background - PC Only */}
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
                <p className="text-[10px] font-bold text-[#C7F964] tracking-[0.2em] uppercase opacity-80">Design Excellence</p>
              </div>
            </div>

            <div className="space-y-6">
              <h1 className="text-5xl lg:text-[4rem] font-black text-white leading-[1] tracking-tighter uppercase">
                Architecture <br />
                <span className="text-[#C7F964]">your</span> vision.
              </h1>
              <p className="text-lg lg:text-xl text-white/70 max-w-lg leading-relaxed font-medium">
                Nền tảng quản trị dự án thế hệ mới dành cho các đội ngũ ưu tiên sự tinh gọn và hiệu năng vượt trội.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-4">
              {[
                { icon: ShieldCheck, text: "Bảo mật Obsidian" },
                { icon: Zap, text: "Hiệu năng Kinetic" },
                { icon: Globe, text: "Global Workspace" },
                { icon: Sparkles, text: "AI Editorial Assistant" },
              ].map((feature, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 + i * 0.1 }}
                  className="flex items-center gap-3 p-4 rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 hover:bg-white/10 transition-all cursor-default group"
                >
                  <feature.icon className="w-5 h-5 text-[#C7F964] group-hover:scale-110 transition-transform" />
                  <span className="text-[0.75rem] font-bold text-white/80 uppercase tracking-tight">{feature.text}</span>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>

      {/* Right Side: Form Section */}
      <div className="flex-1 flex flex-col justify-center items-center p-8 bg-[#F7F9FB] dark:bg-[#04100E] relative overflow-y-auto">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="w-full max-w-[460px] space-y-8 my-auto"
        >
          <div className="mb-6 text-center lg:hidden flex flex-col items-center">
            <img 
              src="/logos/logo thương hiệu.svg" 
              alt="TeamFlow Logo" 
              className="w-24 h-24 object-contain -my-4 mb-2 drop-shadow-xl" 
            />
            <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter">TEAMFLOW</h1>
          </div>

          <div className="space-y-2 text-left">
            <h2 className="text-[2.25rem] font-black text-[#191C1E] dark:text-[#E5F4EF] leading-tight tracking-[-0.015em]">Tạo tài khoản</h2>
            <p className="text-[#3F4948] dark:text-slate-400 font-medium text-[1rem]">
              Tham gia cộng đồng TeamFlow ngay hôm nay.
            </p>
          </div>

          <Card className="border-none shadow-[0px_20px_40px_rgba(25,28,30,0.06)] bg-white/70 dark:bg-[#172925]/70 backdrop-blur-[16px] rounded-[2rem] overflow-hidden">
            <CardContent className="pt-8 px-8 pb-0">
              <form onSubmit={handleSubmit} className="space-y-5">
                <AnimatePresence mode="wait">
                  {error && (
                    <motion.div
                      key="error"
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className="p-4 text-sm font-medium text-[#BE123C] bg-[#BE123C]/5 rounded-2xl flex items-center gap-3"
                    >
                      <AlertCircle className="w-5 h-5 flex-shrink-0" />
                      {error}
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="space-y-4">
                  <motion.div variants={itemVariants} className="space-y-2">
                    <Label htmlFor="name" className="text-[0.75rem] font-semibold text-[#3F4948] dark:text-slate-300 ml-1 uppercase tracking-wider">Họ và tên</Label>
                    <div className="relative group">
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-[#035D5B] transition-colors" />
                      <Input
                        id="name"
                        name="name"
                        type="text"
                        placeholder="Nguyễn Văn A"
                        autoComplete="name"
                        className="h-12 pl-12 bg-[#F2F4F6] dark:bg-[#071613] border-none rounded-2xl focus:ring-2 focus:ring-[#035D5B]/20 focus:bg-white transition-all text-[0.875rem]"
                        required
                      />
                    </div>
                  </motion.div>

                  <motion.div variants={itemVariants} className="space-y-2">
                    <Label htmlFor="email" className="text-[0.75rem] font-semibold text-[#3F4948] dark:text-slate-300 ml-1 uppercase tracking-wider">Địa chỉ Email</Label>
                    <div className="relative group">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-[#035D5B] transition-colors" />
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        placeholder="name@company.com"
                        autoComplete="email"
                        className="h-12 pl-12 bg-[#F2F4F6] dark:bg-[#071613] border-none rounded-2xl focus:ring-2 focus:ring-[#035D5B]/20 focus:bg-white transition-all text-[0.875rem]"
                        required
                      />
                    </div>
                  </motion.div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <motion.div variants={itemVariants} className="space-y-2">
                      <Label htmlFor="password" className="text-[0.75rem] font-semibold text-[#3F4948] dark:text-slate-300 ml-1 uppercase tracking-wider">Mật khẩu</Label>
                      <div className="relative group">
                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-[#035D5B] transition-colors" />
                        <Input
                          id="password"
                          name="password"
                          type="password"
                          placeholder="••••••••"
                          autoComplete="new-password"
                          className="h-12 pl-12 bg-[#F2F4F6] dark:bg-[#071613] border-none rounded-2xl focus:ring-2 focus:ring-[#035D5B]/20 focus:bg-white transition-all text-[0.875rem]"
                          required
                        />
                      </div>
                    </motion.div>

                    <motion.div variants={itemVariants} className="space-y-2">
                      <Label htmlFor="confirmPassword" className="text-[0.75rem] font-semibold text-[#3F4948] dark:text-slate-300 ml-1 uppercase tracking-wider">Xác nhận</Label>
                      <div className="relative group">
                        <CheckCircle2 className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-[#035D5B] transition-colors" />
                        <Input
                          id="confirmPassword"
                          name="confirmPassword"
                          type="password"
                          placeholder="••••••••"
                          autoComplete="new-password"
                          className="h-12 pl-12 bg-[#F2F4F6] dark:bg-[#071613] border-none rounded-2xl focus:ring-2 focus:ring-[#035D5B]/20 focus:bg-white transition-all text-[0.875rem]"
                          required
                        />
                      </div>
                    </motion.div>
                  </div>
                </div>

                <motion.div variants={itemVariants} className="pb-8 pt-2">
                  <Button
                    type="submit"
                    className="w-full h-14 bg-gradient-to-r from-[#035D5B] to-[#004442] shadow-lg shadow-[#035D5B]/20 hover:shadow-xl hover:shadow-[#035D5B]/30 active:scale-[0.98] transition-all rounded-full text-white font-bold text-[0.875rem] group"
                    disabled={loading}
                  >
                    {loading ? (
                      <div className="flex items-center gap-2">
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Processing...
                      </div>
                    ) : (
                      <div className="flex items-center justify-center gap-3">
                        Khởi tạo tài khoản
                        <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                      </div>
                    )}
                  </Button>
                </motion.div>
              </form>
            </CardContent>

            <CardFooter className="pb-8 flex flex-col space-y-4 border-t border-[#F2F4F6] dark:border-slate-800 pt-8">
              <div className="w-full flex items-center justify-center gap-2 text-[0.875rem]">
                <span className="text-[#3F4948] dark:text-slate-400 font-medium">Bạn đã là thành viên?</span>
                <Link
                  href="/login"
                  className="font-bold text-[#035D5B] hover:text-[#004442] dark:text-teal-400 hover:underline underline-offset-4 decoration-2 transition-all"
                >
                  Đăng nhập
                </Link>
              </div>
            </CardFooter>
          </Card>

          <footer className="pt-4 text-center">
            <p className="text-[0.6875rem] text-slate-400 dark:text-slate-600 leading-relaxed uppercase tracking-[0.05em] font-bold">
              © 2024 TeamFlow Inc. Mọi quyền được bảo lưu.
            </p>
          </footer>
        </motion.div>
      </div>
    </div>
  );
}
