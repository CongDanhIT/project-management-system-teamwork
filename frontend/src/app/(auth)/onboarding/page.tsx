'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Layout, ArrowRight, Building2, Sparkles, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
      await queryClient.invalidateQueries({ queryKey: ['workspaces'] });
      router.push(`/workspace/${workspace._id}`);
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || 'Không thể tạo Workspace. Vui lòng thử lại.';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="relative min-h-screen w-full flex items-center justify-center overflow-hidden bg-slate-50 dark:bg-[#050505]">
      {/* Background Section - Editorial Video Layer */}
      <div className="absolute inset-0 z-0">
        {/* Mobile: Static Editorial Gradient */}
        <div className="lg:hidden absolute inset-0 bg-gradient-to-br from-slate-100 via-slate-50 to-slate-100 dark:from-[#050505] dark:via-[#0A0F0E] dark:to-[#050505]" />
        
        {/* Desktop: Dynamic Video Background */}
        <video
          autoPlay
          muted
          loop
          playsInline
          className="hidden lg:block absolute inset-0 w-full h-full object-cover opacity-10 dark:opacity-40 grayscale-[0.5] dark:grayscale-[0.2]"
        >
          <source src="https://player.vimeo.com/external/494444983.hd.mp4?s=38274d8122964e56598c17b5f25a7d6da0e309d9&profile_id=175" type="video/mp4" />
        </video>
        
        {/* Editorial Overlays */}
        <div className="absolute inset-0 bg-white/60 dark:bg-black/40 backdrop-blur-[2px]" />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-50 via-transparent to-slate-50/60 dark:from-[#050505] dark:via-transparent dark:to-[#050505]/60" />
      </div>

      {/* Decorative Editorial Elements */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-brand-primary/10 dark:bg-[#00FFD1]/10 blur-[120px] rounded-full -translate-y-1/2 translate-x-1/2 z-0" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-brand-secondary/20 dark:bg-[#CCFF00]/5 blur-[100px] rounded-full translate-y-1/2 -translate-x-1/2 z-0" />

      {/* Content Section */}
      <div className="relative z-10 w-full max-w-[1200px] px-6 grid lg:grid-cols-2 gap-16 items-center">
        
        {/* Left Side: Editorial Vision */}
        <motion.div 
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="hidden lg:flex flex-col space-y-8"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 bg-brand-primary/10 dark:bg-[#00FFD1]/10 rounded-xl border border-brand-primary/20 dark:border-[#00FFD1]/20 backdrop-blur-md">
              <Sparkles className="w-6 h-6 text-brand-primary dark:text-[#00FFD1]" />
            </div>
            <span className="text-brand-primary dark:text-[#00FFD1] font-medium tracking-[0.2em] text-xs uppercase">Welcome to the future</span>
          </div>

          <h1 className="text-[64px] font-bold leading-[1.1] tracking-tight text-slate-900 dark:text-white drop-shadow-sm dark:drop-shadow-2xl">
            Sáng tạo <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-primary to-brand-secondary dark:from-[#00FFD1] dark:to-[#CCFF00]">
              Không giới hạn.
            </span>
          </h1>

          <p className="text-lg text-slate-600 dark:text-slate-400 max-w-md leading-relaxed">
            Chúng ta sẽ khởi đầu bằng việc xây dựng một không gian làm việc chuyên nghiệp cho đội ngũ của bạn.
          </p>

          <div className="flex flex-col gap-4">
            {[
              { icon: ShieldCheck, text: "Bảo mật dữ liệu tuyệt đối" },
              { icon: Layout, text: "Quản lý dự án trực quan" }
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-4 text-slate-700 dark:text-slate-300">
                <item.icon className="w-5 h-5 text-brand-primary dark:text-[#CCFF00]" />
                <span className="text-sm font-medium tracking-wide">{item.text}</span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Right Side: Glassmorphism Functional Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="w-full max-w-[480px] justify-self-center lg:justify-self-end"
        >
          <div className="bg-white/70 dark:bg-white/[0.03] backdrop-blur-[16px] p-8 lg:p-10 rounded-[32px] border border-slate-200/50 dark:border-white/10 shadow-xl dark:shadow-2xl relative overflow-hidden group">
            {/* Subtle light effect on hover */}
            <div className="absolute inset-0 bg-gradient-to-br from-brand-primary/5 dark:from-[#00FFD1]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />

            <div className="relative z-10 flex flex-col space-y-8">
              {/* Identity */}
              <div className="flex flex-col space-y-2">
                <h2 className="text-3xl lg:text-[32px] font-bold text-slate-900 dark:text-white tracking-tight text-center lg:text-left">Thiết lập Workspace</h2>
                <p className="text-slate-500 dark:text-slate-400 text-sm text-center lg:text-left">Workspace là trái tim trong quy trình của bạn.</p>
              </div>

              {/* Form Input Section */}
              <form id="onboarding-form" onSubmit={handleSubmit} className="space-y-6">
                <AnimatePresence mode="wait">
                  {error && (
                    <motion.div 
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="px-4 py-3 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-2xl text-red-600 dark:text-red-400 text-xs font-medium"
                    >
                      {error}
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="space-y-6">
                  <div className="space-y-2.5">
                    <Label htmlFor="name" className="text-[11px] uppercase tracking-[0.15em] font-bold text-slate-500 ml-1">
                      Tên Workspace
                    </Label>
                    <div className="relative group/input">
                      <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 dark:text-slate-500 group-focus-within/input:text-brand-primary dark:group-focus-within/input:text-[#00FFD1] transition-colors" />
                      <Input
                        id="name"
                        name="name"
                        placeholder="Ví dụ: Team Flow Studio"
                        className="bg-slate-50 dark:bg-white/[0.03] border-slate-200 dark:border-white/5 h-14 pl-12 rounded-2xl focus:ring-brand-primary/30 dark:focus:ring-[#00FFD1]/30 focus:border-brand-primary/50 dark:focus:border-[#00FFD1]/50 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-600 transition-all duration-300 shadow-inner dark:shadow-none"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2.5">
                    <Label htmlFor="description" className="text-[11px] uppercase tracking-[0.15em] font-bold text-slate-500 ml-1">
                      Mô tả dự án
                    </Label>
                    <Textarea
                      id="description"
                      name="description"
                      placeholder="Chia sẻ ngắn gọn về mục tiêu của team bạn..."
                      className="bg-slate-50 dark:bg-white/[0.03] border-slate-200 dark:border-white/5 min-h-[120px] p-4 rounded-2xl focus:ring-brand-primary/30 dark:focus:ring-[#00FFD1]/30 focus:border-brand-primary/50 dark:focus:border-[#00FFD1]/50 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-600 resize-none transition-all duration-300 shadow-inner dark:shadow-none"
                    />
                  </div>
                </div>

                <div className="pt-4">
                  <Button
                    type="submit"
                    className="w-full h-14 bg-gradient-to-r from-brand-primary to-brand-secondary dark:from-[#00FFD1] dark:to-[#CCFF00] hover:shadow-[0_0_25px_rgba(3,93,91,0.4)] dark:hover:shadow-[0_0_25px_rgba(0,255,209,0.4)] text-white dark:text-black font-bold text-base rounded-2xl transition-all duration-500 group"
                    disabled={loading}
                  >
                    {loading ? (
                      <div className="flex items-center justify-center gap-2">
                        <div className="w-4 h-4 border-2 border-white/30 dark:border-black/30 border-t-white dark:border-t-black rounded-full animate-spin" />
                        <span>Đang khởi tạo...</span>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center gap-2">
                        <span>Bắt đầu ngay</span>
                        <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                      </div>
                    )}
                  </Button>
                </div>
              </form>

              <p className="text-center text-xs text-slate-500 dark:text-slate-600 font-medium">
                Bạn có thể tùy chỉnh thêm trong phần Cài đặt Workspace sau này.
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </main>
  );
}
