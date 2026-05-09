'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Sparkles, ArrowRight, Zap, Github, Twitter, Linkedin, Mail, ExternalLink, Bot, Layout, PieChart, CheckCircle, Rocket } from 'lucide-react';
import DarkVeil from '../DarkVeil';
import { motion, useMotionValue, useSpring, useMotionTemplate, useTransform, useScroll, useMotionValueEvent, AnimatePresence, useInView, animate } from 'framer-motion';

const LandingPage = () => {
  // Cursor Spotlight & Parallax Logic
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const springConfig = { damping: 25, stiffness: 150 };
  const springX = useSpring(mouseX, springConfig);
  const springY = useSpring(mouseY, springConfig);

  // Parallax transforms for different depths
  const shard1X = useTransform(springX, [0, 1920], [20, -20]);
  const shard1Y = useTransform(springY, [0, 1080], [20, -20]);

  const shard2X = useTransform(springX, [0, 1920], [-40, 40]);
  const shard2Y = useTransform(springY, [0, 1080], [-40, 40]);

  const shard3X = useTransform(springX, [0, 1920], [30, -30]);
  const shard3Y = useTransform(springY, [0, 1080], [10, -10]);

  React.useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      mouseX.set(e.clientX);
      mouseY.set(e.clientY);
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [mouseX, mouseY]);

  return (
    <div className="min-h-screen bg-[#050505] text-slate-200 selection:bg-brand-secondary/30 selection:text-brand-secondary font-inter">
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes ai-particle-float {
          0% { transform: translateY(0) scale(1); opacity: 0; }
          20% { opacity: 0.8; }
          100% { transform: translateY(-300px) scale(0.5); opacity: 0; }
        }
        .ai-particle {
          position: absolute;
          width: 3px;
          height: 3px;
          background: #C7F964;
          border-radius: 50%;
          filter: blur(1px);
          pointer-events: none;
          animation: ai-particle-float linear infinite;
        }
      `}} />
      {/* Refined Atmospheric Header */}
      <motion.header
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="fixed top-6 left-1/2 -translate-x-1/2 z-50 w-[95%] max-w-7xl flex items-center justify-between px-8 py-3 bg-[#0a0a0a]/60 backdrop-blur-xl border border-white/10 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.5)]"
      >
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-brand-secondary flex items-center justify-center shadow-[0_0_20px_rgba(199,249,100,0.3)]">
            <Sparkles className="h-5 w-5 text-brand-primary" />
          </div>
          <span className="text-xl font-black tracking-tighter text-white uppercase italic">TeamFlow</span>
        </div>

        {/* Central Navigation - Mock Links */}
        <nav className="hidden lg:flex items-center gap-10">
          {['Sản phẩm', 'Giải pháp', 'Bảng giá', 'Tài nguyên'].map((item) => (
            <a
              key={item}
              href="#"
              className="text-[11px] font-black uppercase tracking-[0.2em] text-white/40 hover:text-brand-secondary transition-all duration-300 relative group"
            >
              {item}
              <span className="absolute -bottom-1 left-0 w-0 h-[1px] bg-brand-secondary transition-all duration-300 group-hover:w-full" />
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-6">
          <Link href="/login">
            <span className="text-[11px] font-black uppercase tracking-[0.2em] text-white/50 hover:text-white transition-colors cursor-pointer">
              Đăng nhập
            </span>
          </Link>
          <Link href="/register">
            <Button className="text-[11px] font-black bg-white text-slate-950 hover:bg-brand-secondary hover:text-brand-primary rounded-xl px-7 py-5 uppercase tracking-tighter transition-all duration-300 shadow-xl">
              Đăng ký
            </Button>
          </Link>
        </div>
      </motion.header>

      {/* Hero Section - Full Screen Immersive Layout */}
      <main className="relative min-h-screen flex flex-col overflow-hidden bg-slate-950">
        {/* Interactive Spotlight Layer */}
        <motion.div
          className="pointer-events-none absolute inset-0 z-10"
          style={{
            background: useMotionTemplate`radial-gradient(800px at ${springX}px ${springY}px, rgba(199, 249, 100, 0.08), transparent 80%)`
          }}
        />

        {/* Animated Background Slot - Full Coverage */}
        <div className="absolute inset-0 z-0 opacity-40">
          <DarkVeil
            hueShift={135}
            noiseIntensity={0}
            scanlineIntensity={0}
            speed={1.5}
            scanlineFrequency={0.5}
            warpAmount={1.2}
            resolutionScale={1}
          />
          <div className="absolute inset-0 bg-gradient-to-b from-slate-950/40 via-transparent to-slate-950"></div>
        </div>

        {/* Floating UI Shards - Parallax Layer */}
        <div className="absolute inset-0 z-10 pointer-events-none hidden lg:block">
          {/* Shard 1: AI Analysis */}
          <motion.div
            style={{ x: shard1X, y: shard1Y }}
            animate={{ y: [0, -20, 0] }}
            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
            className="absolute top-[35%] left-[12%] p-4 bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl w-48"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="h-6 w-6 rounded-full bg-brand-secondary flex items-center justify-center">
                <Bot className="h-3 w-3 text-brand-primary" />
              </div>
              <div className="h-2 w-16 bg-white/20 rounded-full"></div>
            </div>
            <div className="space-y-2">
              <div className="h-1.5 w-full bg-white/10 rounded-full"></div>
              <div className="h-1.5 w-2/3 bg-white/10 rounded-full"></div>
            </div>
          </motion.div>

          {/* Shard 2: Priority Status */}
          <motion.div
            style={{ x: shard2X, y: shard2Y }}
            animate={{ y: [0, 20, 0] }}
            transition={{ duration: 8, repeat: Infinity, ease: "easeInOut", delay: 1 }}
            className="absolute bottom-[30%] right-[20%] p-3 bg-brand-primary/20 backdrop-blur-md border border-brand-primary/20 rounded-xl flex items-center gap-3"
          >
            <div className="h-2 w-2 rounded-full bg-brand-secondary animate-pulse"></div>
            <span className="text-[8px] font-black text-white/70 uppercase tracking-widest">High Priority Task</span>
          </motion.div>

          {/* Shard 3: Progress/Chart */}
          <motion.div
            style={{ x: shard3X, y: shard3Y }}
            animate={{ y: [0, -15, 0] }}
            transition={{ duration: 7, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
            className="absolute top-[15%] right-[15%] p-4 bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl"
          >
            <div className="flex items-end gap-1.5 h-12">
              {[40, 70, 45, 90].map((h, i) => (
                <div key={i} className="w-1.5 bg-brand-secondary/40 rounded-t-sm" style={{ height: `${h}%` }}></div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Center Content Area */}
        <section className="relative z-10 flex-1 flex flex-col items-center justify-center text-center px-6 space-y-8 max-w-5xl mx-auto w-full">
          {/* Editorial Badge */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/5 border border-white/10"
          >
            <span className="relative flex h-1.5 w-1.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-secondary opacity-75"></span>
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-brand-primary"></span>
            </span>
            <span className="text-[8px] font-black uppercase tracking-[0.3em] text-brand-secondary">TeamFlow v2.0 Editorial</span>
          </motion.div>

          {/* High-Impact Headline */}
          <div className="relative">
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="text-5xl md:text-[80px] font-black tracking-[-0.06em] text-white leading-[1.15] max-w-4xl uppercase"
            >
              Quản lý <span className="text-brand-secondary italic">Dự án</span> <br />
              <span className="relative inline-block">
                Tầm cao
                <span className="bg-brand-secondary text-brand-primary px-5 py-2 rounded-xl inline-block -rotate-1 ml-3 scale-90 md:scale-95 leading-none">Mới</span>
              </span>
            </motion.h1>
          </div>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 0.4 }}
            className="text-base md:text-lg text-slate-400 max-w-2xl font-medium leading-relaxed"
          >
            Hệ thống quản lý thông minh theo nguyên lý <span className="text-white font-bold italic">Editorial Tech</span>. <br className="hidden md:block" />
            Đưa hiệu suất đội ngũ lên tầm cao mới với thiết kế tối giản.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.6 }}
            className="flex flex-col sm:flex-row items-center gap-4 pt-2"
          >
            <Link href="/login">
              <Button size="lg" className="bg-brand-secondary hover:bg-[#d4ff80] text-slate-950 font-black rounded-2xl px-10 py-7 text-lg transition-all duration-300 hover:scale-105 active:scale-95 group uppercase tracking-tighter">
                Khám phá ngay
                <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform duration-300 text-slate-950" />
              </Button>
            </Link>

            <Link href="/login">
              <Button variant="outline" size="lg" className="border-white/10 hover:border-brand-primary/40 text-white font-black rounded-2xl px-10 py-7 text-lg transition-all duration-300 bg-white/5 backdrop-blur-sm uppercase tracking-tighter">
                Xem Demo
              </Button>
            </Link>
          </motion.div>
        </section>

        {/* Social Proof - Positioned at Bottom */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 1 }}
          className="relative z-10 pb-24 w-full"
        >
          <p className="text-[9px] font-black uppercase tracking-[0.3em] text-slate-500 mb-8 text-center">Được tin dùng bởi các đội ngũ dẫn đầu</p>
          <div className="flex flex-wrap justify-center items-center gap-10 md:gap-20 opacity-30 grayscale hover:opacity-50 transition-opacity duration-500">
            {['Stripe', 'Airbnb', 'Figma', 'Notion', 'Linear'].map((brand) => (
              <span key={brand} className="text-xl font-black tracking-tighter text-white uppercase italic">
                {brand}
              </span>
            ))}
          </div>
        </motion.div>
      </main>

      {/* Product Showcase Section - Clean Editorial Transition */}
      <section className="relative z-20 bg-[#F8FAFC] py-32 px-6 rounded-t-[60px] md:rounded-t-[100px]">
        <div className="max-w-7xl mx-auto">
          <TabbedShowcase />
        </div>
      </section>

      {/* Cinematic Transition Bridge */}
      <div className="relative h-64 bg-gradient-to-b from-[#F8FAFC] via-[#F8FAFC] to-[#050505] z-20 overflow-hidden">
        <motion.div 
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          className="absolute inset-0"
        >
          <div className="absolute top-1/2 left-1/4 w-64 h-64 bg-brand-primary/10 blur-[120px] rounded-full animate-pulse"></div>
          <div className="absolute top-1/2 right-1/4 w-96 h-96 bg-brand-secondary/5 blur-[150px] rounded-full animate-pulse" style={{ animationDelay: '1s' }}></div>
        </motion.div>
      </div>

      {/* Section 3: Editorial Workflow - Sticky Scroll */}
      <WorkflowSection />

      {/* Section 4: Social Proof & Metrics - Productivity Report */}
      <MetricsSection />

      {/* Section 5: Final CTA - The Impact Card */}
      <FinalCTASection />

      <Footer />
    </div>
  );
};

const FinalCTASection = () => {
  return (
    <section className="bg-[#050505] py-20 px-6">
      <div className="max-w-7xl mx-auto">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="relative bg-[#035D5B] rounded-[3rem] md:rounded-[4rem] p-12 md:p-24 overflow-hidden border border-white/10"
        >
          {/* Subtle Grid Pattern (Perfect Loop to Hero) */}
          <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, rgba(255,255,255,0.1) 1px, transparent 0)', backgroundSize: '40px 40px' }}></div>
          
          {/* Ambient Glows */}
          <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[80%] bg-brand-primary/10 blur-[120px] rounded-full pointer-events-none"></div>
          <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[80%] bg-brand-primary/10 blur-[120px] rounded-full pointer-events-none"></div>

          <div className="relative z-10 flex flex-col items-center text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
            >
              <span className="bg-white/10 backdrop-blur-md border border-white/20 text-white font-bold py-2 px-6 rounded-full text-sm mb-8 inline-block uppercase tracking-widest">
                Đã đến lúc thay đổi
              </span>
              
              <h2 className="text-4xl md:text-7xl font-black text-white tracking-tighter mb-8 leading-[1.1]">
                Sẵn sàng đưa đội ngũ của bạn<br />
                <span className="italic text-brand-primary">lên tầm cao mới?</span>
              </h2>
              
              <p className="text-white/70 text-lg md:text-xl font-medium max-w-2xl mx-auto mb-12 leading-relaxed">
                Gia nhập cùng hàng trăm đội ngũ đang định nghĩa lại hiệu suất làm việc với sức mạnh từ AI. Bắt đầu ngay hôm nay, hoàn toàn miễn phí.
              </p>

              <div className="flex flex-col items-center gap-6">
                {/* Pulsing CTA Button */}
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.98 }}
                  className="relative group h-16 md:h-20 px-10 md:px-16 bg-brand-primary text-[#050505] font-black text-lg md:text-xl rounded-2xl shadow-[0_0_30px_rgba(199,249,100,0.3)] hover:shadow-[0_0_50px_rgba(199,249,100,0.5)] transition-all duration-500 overflow-hidden"
                >
                  {/* Internal Glow Effect */}
                  <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000 ease-in-out"></div>
                  
                  <span className="relative z-10 flex items-center gap-3 italic uppercase">
                    Khám phá TeamFlow miễn phí <ArrowRight className="w-6 h-6 not-italic" />
                  </span>

                  {/* External Pulsing Glow */}
                  <motion.div
                    className="absolute inset-0 rounded-2xl bg-brand-primary opacity-0"
                    animate={{
                      scale: [1, 1.2],
                      opacity: [0.5, 0]
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      ease: "easeOut"
                    }}
                  />
                </motion.button>

                <p className="text-white/40 font-bold text-sm uppercase tracking-widest">
                  Không cần thẻ tín dụng. Cài đặt trong 30 giây.
                </p>
              </div>
            </motion.div>
          </div>

          {/* Floating UI Shards - Visual Recall */}
          <motion.div 
            animate={{ y: [0, -20, 0], rotate: [0, 5, 0] }}
            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
            className="absolute top-20 right-[-5%] w-64 h-64 bg-white/5 border border-white/10 rounded-3xl backdrop-blur-sm -rotate-12 pointer-events-none hidden lg:block"
          />
          <motion.div 
            animate={{ y: [0, 20, 0], rotate: [0, -5, 0] }}
            transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
            className="absolute bottom-20 left-[-5%] w-48 h-48 bg-white/5 border border-white/10 rounded-3xl backdrop-blur-sm rotate-12 pointer-events-none hidden lg:block"
          />
        </motion.div>
      </div>
    </section>
  );
};

const MetricsSection = () => {
  return (
    <section className="bg-[#050505] py-32 px-6 relative overflow-hidden" style={{ contain: 'paint layout' }}>
      {/* Background Decorative Elements */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[1px] bg-gradient-to-r from-transparent via-white/10 to-transparent"></div>
      
      <div className="max-w-7xl mx-auto">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-20 transform-gpu"
        >
          <span className="text-brand-primary font-black text-xs uppercase tracking-[0.4em] mb-4 block">System Performance</span>
          <h2 className="text-4xl md:text-6xl font-black text-white tracking-tighter italic uppercase">
            Báo cáo <span className="text-white/40">Năng suất</span>
          </h2>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          <MetricCard 
            className="md:col-span-7 h-[400px]"
            value="6"
            suffix="x"
            title="Tốc độ lập kế hoạch dự án"
            desc="Nhờ Trợ lý AI Agent, việc phân rã task từ ý tưởng ban đầu nhanh hơn gấp 6 lần so với phương pháp thủ công."
            isMain
          />

          {/* Metric 2: Scale (15,400+) - Occupies 5/12 columns */}
          <MetricCard 
            className="md:col-span-5 h-[400px]"
            value="15400"
            prefix=""
            suffix="+"
            title="Task đã được tối ưu"
            desc="Hệ thống đã xử lý và điều phối hàng vạn công việc, đảm bảo không có task nào bị bỏ sót hay chồng chéo."
          />

          {/* Metric 3: Reliability (94%) - Occupies 5/12 columns */}
          <MetricCard 
            className="md:col-span-5 h-[350px]"
            value="94"
            suffix="%"
            title="Dự án về đích đúng hạn"
            desc="Các cảnh báo sớm từ Analytics giúp các đội ngũ điều chỉnh nguồn lực kịp thời, giảm thiểu tối đa rủi ro chậm trễ."
          />

          {/* Metric 4: Deep Work (+4h) - Occupies 7/12 columns */}
          <MetricCard 
            className="md:col-span-7 h-[350px]"
            value="4"
            prefix="+"
            suffix="h"
            title="Thời gian tập trung mỗi tuần"
            desc="Loại bỏ sự xao nhãng từ các thông báo không cần thiết, giúp mỗi thành viên có thêm ít nhất 4 giờ làm việc chuyên sâu."
          />
        </div>
      </div>
    </section>
  );
};

const NumberTicker = ({ value, isMain }: { value: string, isMain: boolean }) => {
  const spanRef = useRef<HTMLSpanElement>(null);
  const numericValue = parseFloat(value.replace(/,/g, ''));
  const isInView = useInView(spanRef, { once: true, margin: "-50px" });

  useEffect(() => {
    if (isInView && spanRef.current) {
      const node = spanRef.current;
      const controls = animate(0, numericValue, {
        duration: 2,
        ease: [0.16, 1, 0.3, 1],
        onUpdate: (latest) => {
          node.textContent = value.includes('15400') 
            ? Math.round(latest).toLocaleString() 
            : Math.round(latest).toString();
        }
      });
      return () => controls.stop();
    }
  }, [isInView, numericValue, value]);

  return (
    <span 
      ref={spanRef} 
      className={`font-black text-white tracking-tighter transform-gpu will-change-transform ${isMain ? 'text-7xl md:text-9xl' : 'text-5xl md:text-7xl'}`}
    >
      0
    </span>
  );
};

const MetricCard = ({ value, prefix = "", suffix = "", title, desc, className = "", isMain = false }: any) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const handleMouseMove = ({ currentTarget, clientX, clientY }: React.MouseEvent) => {
    const { left, top } = currentTarget.getBoundingClientRect();
    mouseX.set(clientX - left);
    mouseY.set(clientY - top);
  };

  return (
    <motion.div 
      ref={cardRef}
      onMouseMove={handleMouseMove}
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      whileHover={{ y: -5 }}
      viewport={{ once: true, margin: "-50px" }}
      className={`group relative bg-[#0A0A0A] border border-white/10 rounded-[2.5rem] p-10 overflow-hidden flex flex-col justify-between hover:border-brand-primary/30 transition-all duration-500 transform-gpu will-change-transform ${className}`}
    >
      {/* Spotlight Effect */}
      <motion.div
        className="pointer-events-none absolute -inset-px rounded-[2.5rem] opacity-0 group-hover:opacity-100 transition-opacity duration-500"
        style={{
          background: useMotionTemplate`
            radial-gradient(
              600px circle at ${mouseX}px ${mouseY}px,
              rgba(199, 249, 100, 0.08),
              transparent 80%
            )
          `,
        }}
      />

      {/* Noise Texture Overlay */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none mix-blend-overlay bg-[url('https://grainy-gradients.vercel.app/noise.svg')]"></div>

      {/* Sparkline Decorative Background - Living Edition */}
      <div className="absolute inset-x-0 bottom-0 h-32 opacity-10 group-hover:opacity-40 transition-all duration-700 pointer-events-none transform-gpu">
        <svg className="w-full h-full" viewBox="0 0 400 100" preserveAspectRatio="none">
          <motion.path
            d="M0,80 Q50,20 100,70 T200,40 T300,90 T400,30"
            fill="none"
            stroke="#C7F964"
            strokeWidth="1.5"
            initial={{ pathLength: 0 }}
            whileInView={{ pathLength: 1 }}
            transition={{ duration: 1.5, ease: "easeInOut" }}
          />
          <motion.circle
            cx="400"
            cy="30"
            r="3"
            fill="#C7F964"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: [0, 1, 0.5, 1] }}
            transition={{ delay: 1.5, duration: 2, repeat: Infinity }}
          />
          <motion.circle
            cx="400"
            cy="30"
            r="6"
            stroke="#C7F964"
            strokeWidth="1"
            fill="none"
            initial={{ scale: 0, opacity: 0 }}
            whileInView={{ scale: [1, 2], opacity: [0.5, 0] }}
            transition={{ delay: 1.5, duration: 2, repeat: Infinity }}
          />
        </svg>
      </div>

      <div className="relative z-10">
        <div className={`flex items-baseline gap-1 ${isMain ? 'mb-8' : 'mb-4'}`}>
          {prefix && <span className={`font-black text-brand-primary transform-gpu ${isMain ? 'text-4xl md:text-6xl' : 'text-3xl md:text-5xl'}`}>{prefix}</span>}
          <motion.div whileHover={{ scale: 1.05 }} className="inline-block transition-transform duration-300">
            <NumberTicker value={value} isMain={isMain} />
          </motion.div>
          <span className={`font-black text-brand-primary transform-gpu ${isMain ? 'text-4xl md:text-6xl' : 'text-3xl md:text-5xl'}`}>{suffix}</span>
        </div>
        
        <h3 className={`font-bold text-white mb-4 transform-gpu ${isMain ? 'text-2xl md:text-3xl' : 'text-xl'}`}>
          {title}
        </h3>
      </div>

      <div className="relative z-10">
        <p className="text-white/40 font-medium leading-relaxed max-w-md transform-gpu group-hover:text-white/60 transition-colors">
          {desc}
        </p>
      </div>

      {/* Decorative corner accent - Minimalist */}
      <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-brand-primary/5 to-transparent rounded-bl-[100%] opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>
    </motion.div>
  );
};

const WorkflowSection = () => {
  const [activeStep, setActiveStep] = useState(-1);
  const containerRef = useRef<HTMLElement>(null);
  const isSectionInView = useInView(containerRef, { once: true, margin: "-10% 0px" });

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"]
  });

  const smoothProgress = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001
  });

  const lineHeight = useTransform(smoothProgress, [0, 1], ["0%", "100%"]);

  useEffect(() => {
    if (isSectionInView && activeStep === -1) {
      setActiveStep(0);
    }
  }, [isSectionInView, activeStep]);

  useMotionValueEvent(scrollYProgress, "change", (latest) => {
    if (!isSectionInView) return;
    
    let nextStep = -1;
    if (latest < 0.33) nextStep = 0;
    else if (latest < 0.66) nextStep = 1;
    else nextStep = 2;

    if (nextStep !== activeStep) {
      setActiveStep(nextStep);
    }
  });

  const steps = [
    {
      id: 'step1',
      number: '01',
      title: 'THIẾT LẬP TRONG TÍCH TẮC',
      desc: 'Tạo Workspace và mời đồng đội chỉ trong vài giây. Không cấu hình phức tạp, chỉ tập trung vào những gì quan trọng nhất.',
      icon: Layout
    },
    {
      id: 'step2',
      number: '02',
      title: 'ĐỂ AI DẪN DẮT LỘ TRÌNH',
      desc: 'Chỉ cần nhập mục tiêu lớn, AI Agent của TeamFlow sẽ tự động phân rã thành các Task chi tiết và một lộ trình khả thi cho cả đội.',
      icon: Sparkles
    },
    {
      id: 'step3',
      number: '03',
      title: 'TẬP TRUNG VÀ CHINH PHỤC',
      desc: 'Bắt đầu làm việc với giao diện tối giản. Theo dõi tiến độ thời gian thực với trợ lý thông minh luôn sẵn sàng hỗ trợ bạn.',
      icon: Rocket
    }
  ];

  return (
    <section ref={containerRef} className="relative min-h-[300vh] bg-[#050505]" style={{ contain: 'paint layout' }}>
      <style>{`
        @keyframes float-up {
          0% { transform: translateY(0); opacity: 0; }
          50% { opacity: 1; }
          100% { transform: translateY(-200px); opacity: 0; }
        }
        .ai-particle {
          position: absolute;
          width: 4px;
          height: 4px;
          background: #C7F964;
          border-radius: 50%;
          animation: float-up infinite linear;
        }
      `}</style>
      <div className="max-w-7xl mx-auto px-6 pt-32 pb-64">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-32"
        >
          <h2 className="text-5xl md:text-8xl font-black text-white tracking-tighter mb-6 italic uppercase leading-none">
            Từ ý tưởng đến <br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-secondary to-lime-200">
              Hiện thực
            </span>
          </h2>
          <p className="text-slate-500 text-xl md:text-2xl font-medium max-w-2xl mx-auto">
            Quy trình 3 bước được tối ưu hóa bởi AI để giúp đội ngũ của bạn đạt hiệu suất tối đa.
          </p>
        </motion.div>

        <div className="relative grid lg:grid-cols-2 gap-24 items-stretch min-h-[300vh]">
          {/* Left Side: Steps Content */}
          <div className="relative pl-12 md:pl-20 pb-[100vh]">
            {/* The Connecting Line */}
            <div className="absolute left-[20px] md:left-[28px] top-0 bottom-[100vh] w-[2px] bg-white/10">
              <motion.div 
                style={{ height: lineHeight }}
                className="absolute top-0 left-0 w-full bg-brand-secondary shadow-[0_0_15px_#C7F964]"
              />
            </div>

            <div className="space-y-[80vh]">
              {steps.map((step, index) => (
                <StepBlock 
                  key={step.id} 
                  step={step} 
                  index={index} 
                  activeStep={activeStep}
                />
              ))}
            </div>
          </div>

          {/* Right Side: Sticky Visuals */}
          <div className="hidden lg:block h-full relative">
            <div className="sticky top-[20vh] h-[60vh] z-10" style={{ contain: 'paint layout' }}>
              <div className="h-full w-full bg-white/5 rounded-[3rem] border border-white/10 backdrop-blur-3xl overflow-hidden relative group shadow-2xl">
                <div className="absolute inset-0 bg-gradient-to-br from-brand-secondary/10 to-transparent opacity-50 group-hover:opacity-70 transition-opacity" />
                <div className="absolute -top-24 -right-24 w-64 h-64 bg-brand-secondary/20 rounded-full blur-[100px]" />
                <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-blue-500/10 rounded-full blur-[100px]" />
                
                <VisualShards activeStep={activeStep} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

const StepBlock = ({ step, index, activeStep }: any) => {
  const isActive = activeStep === index;
  const Icon = step.icon;

  return (
    <div className="relative py-24">
      {/* Circle Node on the line */}
      <div className="absolute -left-[44px] md:-left-[60px] top-0 flex items-center justify-center">
        <motion.div 
          animate={{ 
            scale: isActive ? 1.3 : 1,
            backgroundColor: isActive ? "#C7F964" : "rgba(255,255,255,0.1)",
            boxShadow: isActive ? "0 0 30px rgba(199,249,100,0.8)" : "none"
          }}
          transition={{ type: "spring", stiffness: 300, damping: 20 }}
          className="w-4 h-4 md:w-6 md:h-6 rounded-full border-4 border-[#050505] z-10"
        />
      </div>

      <motion.div
        animate={{ 
          opacity: isActive ? 1 : 0.2,
          x: isActive ? 0 : -10,
          filter: isActive ? "blur(0px)" : "blur(1px)"
        }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="relative"
      >
        <div className={`inline-flex items-center justify-center p-4 rounded-2xl border transition-all duration-700 mb-8 ${
          isActive ? 'bg-brand-secondary/20 border-brand-secondary/40 shadow-[0_0_30px_rgba(199,249,100,0.2)]' : 'bg-white/5 border-white/10'
        }`}>
          <Icon className={`h-8 w-8 transition-colors duration-700 ${isActive ? 'text-brand-secondary' : 'text-slate-500'}`} />
        </div>
        
        <div className="text-sm font-mono text-[#C7F964] mb-4 tracking-[0.3em] opacity-80 uppercase font-bold">STEP {step.number}</div>
        
        <h3 className="text-3xl md:text-5xl font-black text-white uppercase tracking-tighter italic mb-6 leading-tight">
          {step.title}
        </h3>
        
        <p className="text-slate-400 text-lg md:text-xl leading-relaxed max-w-md font-medium">
          {step.desc}
        </p>
      </motion.div>
    </div>
  );
};

const VisualShards = ({ activeStep }: { activeStep: number }) => {
  return (
    <div className="relative w-full h-[500px] flex items-center justify-center p-6 md:p-12">
      {/* Background Glow */}
      <div className="absolute inset-0 bg-brand-secondary/5 blur-[120px] rounded-full" />
      
      <AnimatePresence mode="wait">
        {activeStep === 0 && (
          <motion.div
            key="step1"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.1 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="relative w-[340px] h-[400px] bg-slate-900/40 backdrop-blur-xl rounded-[2.5rem] border border-white/10 p-8 flex flex-col items-center justify-center shadow-2xl transform-gpu"
          >
            {/* Avatars flying in */}
            {[
              { x: -100, y: -80, delay: 0.2, color: 'bg-blue-400' },
              { x: 120, y: -60, delay: 0.4, color: 'bg-purple-400' },
              { x: -80, y: 100, delay: 0.6, color: 'bg-orange-400' },
              { x: 90, y: 110, delay: 0.8, color: 'bg-pink-400' },
            ].map((avatar, i) => (
              <motion.div
                key={i}
                initial={{ x: avatar.x * 2, y: avatar.y * 2, opacity: 0 }}
                animate={{ x: avatar.x, y: avatar.y, opacity: 1 }}
                className={`absolute w-12 h-12 rounded-full border-2 border-slate-900 shadow-xl ${avatar.color}`}
                transition={{ delay: avatar.delay, duration: 0.8, type: "spring" }}
              />
            ))}

            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 1.2, type: "spring" }}
              className="z-10 bg-brand-secondary text-brand-primary px-6 py-2 rounded-full font-black text-xs uppercase tracking-widest shadow-[0_0_30px_rgba(199,249,100,0.5)]"
            >
              Workspace Created
            </motion.div>
          </motion.div>
        )}

        {activeStep === 1 && (
          <motion.div
            key="step2"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.1 }}
            className="relative w-full max-w-md bg-slate-900/40 backdrop-blur-xl rounded-[3rem] border border-brand-primary/20 p-10 overflow-hidden transform-gpu"
          >
            {/* Scanning Beam Animation */}
            <motion.div 
              animate={{ y: [-100, 300, -100] }}
              transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
              className="absolute inset-x-0 h-1 bg-gradient-to-r from-transparent via-brand-primary to-transparent shadow-[0_0_15px_#C7F964] z-10 transform-gpu"
            />

            {/* AI Data Particles - CSS Optimized */}
            <div className="absolute inset-0 pointer-events-none">
              {[...Array(12)].map((_, i) => (
                <div 
                  key={i}
                  className="ai-particle"
                  style={{
                    left: `${15 + (i * 7.5) % 70}%`,
                    bottom: `${-(i * 30) % 100}px`,
                    animationDuration: `${1.5 + (i % 3)}s`,
                    animationDelay: `${i * 0.1}s`
                  }}
                />
              ))}
            </div>

            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-2xl bg-brand-primary flex items-center justify-center">
                  <Sparkles className="h-6 w-6 text-brand-secondary" />
                </div>
                <span className="text-sm font-black text-brand-primary uppercase tracking-[0.3em]">AI Planning</span>
              </div>
              <div className="space-y-4">
                {[1, 2, 3].map((item, i) => (
                  <motion.div
                    key={item}
                    initial={{ x: -20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: 0.2 + (i * 0.1) }}
                    className="h-12 bg-white/5 rounded-2xl border border-white/10 flex items-center px-4 gap-4"
                  >
                    <div className="h-2 w-2 rounded-full bg-brand-primary"></div>
                    <div className="h-2 w-3/4 bg-white/20 rounded-full"></div>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {activeStep === 2 && (
          <motion.div
            key="step3"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative w-[340px] h-[400px] bg-slate-900/40 backdrop-blur-xl rounded-[2.5rem] border border-white/10 p-8 shadow-2xl transform-gpu"
          >
            <div className="mb-8 w-full space-y-4">
               <div className="flex justify-between items-end mb-2">
                  <span className="text-[10px] font-black text-white/40 uppercase tracking-widest">Progress</span>
                  <motion.span 
                    animate={{ opacity: [1, 0.5, 1] }}
                    transition={{ duration: 1, repeat: Infinity }}
                    className="text-brand-primary font-black"
                  >
                    100%
                  </motion.span>
               </div>
               <div className="relative h-4 w-full bg-white/5 rounded-full overflow-hidden border border-white/10">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: "100%" }}
                    transition={{ duration: 1.5, ease: "easeInOut" }}
                    className="absolute inset-y-0 left-0 bg-gradient-to-r from-brand-primary to-brand-secondary shadow-[0_0_20px_rgba(199,249,100,0.4)]"
                  >
                    {/* Living Light Ray inside progress bar */}
                    <motion.div 
                      animate={{ x: ['-100%', '200%'] }}
                      transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                      className="absolute inset-0 w-20 bg-gradient-to-r from-transparent via-white/30 to-transparent skew-x-12"
                    />
                  </motion.div>
               </div>
            </div>

            <div className="space-y-3 w-full">
              {[1, 2, 3, 4].map((item, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0.5 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.3 }}
                  className="h-10 w-full bg-brand-secondary/5 rounded-xl border border-brand-secondary/20 flex items-center justify-between px-4"
                >
                  <div className="h-1.5 w-1/2 bg-white/20 rounded-full" />
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: i * 0.3 + 0.2 }}
                  >
                    <CheckCircle className="w-4 h-4 text-brand-secondary" />
                  </motion.div>
                </motion.div>
              ))}
            </div>

            <motion.div
              initial={{ y: 20, opacity: 0, scale: 0.8 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              transition={{ delay: 1.8, type: "spring" }}
              className="absolute inset-0 m-auto w-48 h-48 bg-brand-secondary rounded-full flex flex-col items-center justify-center text-brand-primary shadow-[0_0_60px_rgba(199,249,100,0.6)] z-30"
            >
              <Rocket className="w-10 h-10 mb-2" />
              <span className="font-black text-[10px] uppercase tracking-tighter">Project Completed</span>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const TabbedShowcase = () => {
  const [activeTab, setActiveTab] = React.useState('projects');

  const tabs = [
    { id: 'projects', label: 'Quản lý Dự án', icon: Zap },
    { id: 'ai', label: 'Trợ lý AI', icon: Sparkles },
    { id: 'insights', label: 'Phân tích & Báo cáo', icon: PieChart },
  ];

  return (
    <div className="space-y-12">
      {/* Editorial Style Tabs with Virtual Cursor Container */}
      <div className="flex flex-wrap justify-center gap-4 md:gap-8 relative pb-4">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-3 px-10 py-5 rounded-2xl font-bold uppercase tracking-tighter transition-all duration-500 relative group`}
          >
            {activeTab === tab.id && (
              <motion.div
                layoutId="active-pill"
                className="absolute inset-0 bg-slate-900 rounded-2xl shadow-depth-2"
                transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
              />
            )}
            <span className="relative z-10 flex items-center gap-3">
              <tab.icon className={`h-5 w-5 transition-colors duration-500 ${activeTab === tab.id ? 'text-brand-secondary' : 'text-slate-400 group-hover:text-slate-600'}`} />
              <span className={`transition-colors duration-500 ${activeTab === tab.id ? 'text-white' : 'text-slate-400 group-hover:text-slate-600'}`}>
                {tab.label}
              </span>
            </span>

            {/* Pulsing indicator for active tab */}
            {activeTab === tab.id && (
              <span className="absolute -top-1 -right-1 flex h-3 w-3 z-20">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-secondary opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-brand-secondary"></span>
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Main Preview Frame */}
      <div className="relative group">
        {/* Animated Virtual Pointer - The '110%' Polish */}
        <motion.div
          animate={{
            x: activeTab === 'projects' ? 200 : activeTab === 'ai' ? 450 : 700,
            y: activeTab === 'projects' ? 150 : activeTab === 'ai' ? 300 : 100,
            scale: [1, 1.2, 1],
          }}
          transition={{ duration: 1.5, ease: "easeInOut" }}
          className="absolute z-50 pointer-events-none hidden md:block"
        >
          <div className="h-7 w-7 rounded-full bg-slate-900/10 backdrop-blur-md border border-slate-900/20 flex items-center justify-center">
            <div className="h-2 w-2 rounded-full bg-brand-primary animate-pulse shadow-[0_0_10px_#C7F964]"></div>
          </div>
        </motion.div>

        {/* Floating Contextual Cards - Liveliness Layer */}
        {/* ... existing code ... */}
        <motion.div
          animate={{ y: [0, -12, 0] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -top-10 -right-4 md:-right-10 z-20 w-64 p-5 bg-white/90 backdrop-blur-xl rounded-3xl shadow-neumorphic border border-brand-secondary/30 hidden md:block"
        >
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-brand-secondary flex items-center justify-center">
              <Zap className="h-5 w-5 text-brand-primary" />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Hoạt động mới</p>
              <p className="text-sm font-bold text-slate-800">Task hoàn thành bởi @Alex</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          animate={{ y: [0, 12, 0] }}
          transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
          className="absolute -bottom-10 -left-4 md:-left-12 z-20 w-72 p-6 bg-brand-primary/95 backdrop-blur-xl rounded-[32px] shadow-depth-2 border border-white/20 hidden md:block"
        >
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Sparkles className="h-5 w-5 text-brand-secondary" />
              <span className="text-[9px] font-black uppercase text-white/50 tracking-[0.2em]">AI Insights</span>
            </div>
            <p className="text-sm font-medium text-white leading-relaxed">
              "Dựa trên hiệu suất tuần này, team có thể hoàn thành dự án sớm hơn 2 ngày."
            </p>
          </div>
        </motion.div>

        {/* Integration Bubbles */}
        <div className="absolute -right-20 top-1/2 -translate-y-1/2 flex flex-col gap-6 opacity-40 grayscale hover:opacity-100 hover:grayscale-0 transition-all duration-500 hidden lg:flex">
          <div className="h-14 w-14 rounded-2xl bg-white shadow-ambient flex items-center justify-center p-3 animate-bounce" style={{ animationDuration: '3s' }}>
            <img src="https://upload.wikimedia.org/wikipedia/commons/d/d5/Slack_icon_2019.svg" alt="Slack" className="w-full h-full p-0.5" />
          </div>
          <div className="h-14 w-14 rounded-2xl bg-white shadow-ambient flex items-center justify-center p-3 animate-bounce" style={{ animationDuration: '4s', animationDelay: '1s' }}>
            <img src="https://upload.wikimedia.org/wikipedia/commons/3/33/Figma-logo.svg" alt="Figma" className="w-full h-full p-1" />
          </div>
          <div className="h-14 w-14 rounded-2xl bg-white shadow-ambient flex items-center justify-center p-3 animate-bounce" style={{ animationDuration: '3.5s', animationDelay: '0.5s' }}>
            <img src="https://upload.wikimedia.org/wikipedia/commons/9/91/Octicons-mark-github.svg" alt="GitHub" className="w-full h-full p-0.5" />
          </div>
        </div>

        {/* Actual Product UI Mockup */}
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, scale: 0.98, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="w-full aspect-[16/9] bg-white/80 backdrop-blur-2xl rounded-[48px] border-[12px] border-white shadow-[0_80px_150px_-30px_rgba(15,23,42,0.12),0_40px_80px_-20px_rgba(15,23,42,0.08)] overflow-hidden relative"
        >
          <div className="w-full h-full overflow-hidden flex flex-col bg-slate-50/50">
            {/* Mockup Toolbar - Dark Theme with Colored Controls */}
            <div className="h-16 border-b border-slate-800 flex items-center justify-between px-8 bg-slate-900">
              <div className="flex gap-2">
                <div className="h-3 w-3 rounded-full bg-[#FF5F56] shadow-sm"></div>
                <div className="h-3 w-3 rounded-full bg-[#FFBD2E] shadow-sm"></div>
                <div className="h-3 w-3 rounded-full bg-[#27C93F] shadow-sm"></div>
              </div>
              <div className="h-8 w-1/3 bg-slate-800/50 rounded-full border border-slate-700 shadow-inner"></div>
              <div className="h-9 w-9 rounded-full bg-white/5 border border-white/10"></div>
            </div>

            {/* Mockup Content Areas */}
            <div className="flex-1 p-10">
              {activeTab === 'projects' && (
                <div className="grid grid-cols-3 gap-8 h-full">
                  {[1, 2, 3].map((col) => (
                    <div key={col} className="space-y-6">
                      <div className="h-5 w-24 bg-slate-200 rounded-full mb-8"></div>
                      {[1, 2].map((card) => (
                        <motion.div
                          key={card}
                          whileHover={{ scale: 1.03, y: -5 }}
                          className="bg-white p-6 rounded-3xl shadow-ambient border border-slate-100 space-y-4 cursor-pointer transition-colors hover:border-brand-primary/20"
                        >
                          <div className="h-4 w-full bg-slate-100 rounded-full"></div>
                          <div className="h-3 w-2/3 bg-slate-50 rounded-full"></div>
                          <div className="flex justify-between items-center pt-2">
                            <div className="h-6 w-16 bg-brand-secondary/30 rounded-full"></div>
                            <div className="h-7 w-7 rounded-full bg-slate-100"></div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  ))}
                </div>
              )}

              {activeTab === 'ai' && (
                <div className="max-w-2xl mx-auto h-full flex flex-col justify-end space-y-6 pb-4">
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="self-start bg-white p-5 rounded-3xl rounded-bl-none shadow-ambient border border-slate-100 max-w-[80%]"
                  >
                    <p className="text-sm text-slate-600 font-medium">Lên kế hoạch cho Sprint tiếp theo giúp tôi.</p>
                  </motion.div>
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.5 }}
                    className="self-end bg-brand-primary p-6 rounded-[32px] rounded-br-none shadow-depth-1 max-w-[85%] space-y-3"
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <Sparkles className="h-4 w-4 text-brand-secondary" />
                      <span className="text-[10px] font-black uppercase text-white/60 tracking-widest">TeamFlow AI</span>
                    </div>
                    <p className="text-sm text-white leading-relaxed">
                      Chắc chắn rồi! Dựa trên ưu tiên hiện tại, tôi đề xuất tập trung vào 3 tính năng cốt lõi:
                      Xử lý Real-time, Tối ưu DB và Nâng cấp UI...
                    </p>
                  </motion.div>

                  {/* AI Typing Indicator */}
                  <motion.div
                    animate={{ opacity: [0.4, 1, 0.4] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                    className="self-start flex gap-1.5 px-4"
                  >
                    <div className="h-1.5 w-1.5 rounded-full bg-slate-300"></div>
                    <div className="h-1.5 w-1.5 rounded-full bg-slate-300"></div>
                    <div className="h-1.5 w-1.5 rounded-full bg-slate-300"></div>
                  </motion.div>

                  <div className="h-14 w-full bg-white rounded-2xl shadow-inner border border-slate-100 flex items-center px-6">
                    <div className="h-4 w-48 bg-slate-100 rounded-full"></div>
                  </div>
                </div>
              )}

              {activeTab === 'insights' && (
                <div className="space-y-10 h-full">
                  <div className="grid grid-cols-4 gap-6">
                    {[1, 2, 3, 4].map(i => (
                      <motion.div
                        key={i}
                        whileHover={{ y: -5, borderColor: '#035D5B' }}
                        className="bg-white p-6 rounded-3xl shadow-ambient border border-slate-50 transition-colors cursor-pointer"
                      >
                        <div className="h-3 w-16 bg-slate-100 rounded-full mb-3"></div>
                        <div className="h-8 w-24 bg-brand-primary/10 rounded-xl"></div>
                      </motion.div>
                    ))}
                  </div>
                  <div className="flex-1 bg-white rounded-[40px] shadow-inner border border-slate-50 p-10 relative overflow-hidden">
                    <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-brand-secondary/20 to-transparent"></div>
                    <div className="flex items-end justify-between h-full gap-4 relative z-10">
                      {[40, 70, 45, 90, 65, 80, 55, 95, 75, 85].map((h, i) => (
                        <motion.div
                          key={i}
                          initial={{ height: 0 }}
                          animate={{ height: `${h}%` }}
                          whileHover={{ backgroundColor: '#C7F964' }}
                          transition={{ duration: 1, delay: i * 0.1 }}
                          className="flex-1 bg-brand-primary rounded-t-xl cursor-pointer"
                        />
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

function Footer() {
  return (
    <footer className="bg-slate-900 pt-24 pb-12 px-6 md:px-12 mt-24 relative overflow-hidden">
      {/* Decorative Gradient Flare */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[1px] bg-gradient-to-r from-transparent via-brand-secondary/50 to-transparent"></div>
      <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-[600px] h-48 bg-brand-secondary/5 blur-[120px] rounded-full"></div>

      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-16 mb-20">
          {/* Brand Identity */}
          <div className="lg:col-span-2 space-y-8">
            <div className="flex items-center gap-3 group cursor-pointer">
              <div className="h-12 w-12 bg-brand-secondary rounded-2xl flex items-center justify-center shadow-lg group-hover:rotate-12 transition-transform duration-500">
                <Zap className="h-7 w-7 text-brand-primary" fill="currentColor" />
              </div>
              <span className="text-2xl font-black tracking-tighter text-white uppercase italic">
                Team<span className="text-brand-secondary">Flow</span>
              </span>
            </div>
            <p className="text-slate-400 text-lg max-w-md leading-relaxed">
              Hệ điều hành công việc thế hệ mới. Ứng dụng AI để giải phóng sức sáng tạo và tối ưu hóa dòng chảy hiệu suất cho mọi đội ngũ.
            </p>
            <div className="flex gap-5">
              {[
                { icon: Github, href: "#" },
                { icon: Twitter, href: "#" },
                { icon: Linkedin, href: "#" }
              ].map((social, i) => (
                <motion.a
                  key={i}
                  href={social.href}
                  whileHover={{ y: -5, color: '#C7F964' }}
                  className="h-12 w-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-slate-400 transition-colors"
                >
                  <social.icon className="h-5 w-5" />
                </motion.a>
              ))}
            </div>
          </div>

          {/* Quick Links Sections */}
          <div className="space-y-6">
            <h4 className="text-white font-black uppercase tracking-widest text-sm">Sản phẩm</h4>
            <ul className="space-y-4">
              {['Tính năng', 'Trợ lý AI', 'Tích hợp', 'Bảng giá', 'Lộ trình'].map((item) => (
                <li key={item}>
                  <a href="#" className="text-slate-400 hover:text-brand-secondary transition-colors font-medium flex items-center gap-2 group">
                    <div className="h-1 w-0 bg-brand-secondary group-hover:w-2 transition-all duration-300"></div>
                    {item}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div className="space-y-6">
            <h4 className="text-white font-black uppercase tracking-widest text-sm">Công ty</h4>
            <ul className="space-y-4">
              {['Về chúng tôi', 'Tuyển dụng', 'Blog', 'Khách hàng', 'Liên hệ'].map((item) => (
                <li key={item}>
                  <a href="#" className="text-slate-400 hover:text-brand-secondary transition-colors font-medium flex items-center gap-2 group">
                    <div className="h-1 w-0 bg-brand-secondary group-hover:w-2 transition-all duration-300"></div>
                    {item}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Newsletter Section */}
          <div className="space-y-6 lg:col-span-1">
            <h4 className="text-white font-black uppercase tracking-widest text-sm">Newsletter</h4>
            <p className="text-slate-400 text-sm leading-relaxed">
              Nhận những cập nhật mới nhất về AI và quản lý công việc.
            </p>
            <div className="relative group">
              <input
                type="email"
                placeholder="Email của bạn..."
                className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-5 pr-14 text-white placeholder:text-slate-600 focus:outline-none focus:border-brand-secondary/50 transition-all"
              />
              <button className="absolute right-2 top-2 h-10 w-10 bg-brand-secondary rounded-xl flex items-center justify-center text-brand-primary hover:scale-105 transition-transform">
                <ArrowRight className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-12 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-8">
          <p className="text-slate-500 text-sm font-medium">
            © 2024 TeamFlow Inc. Mọi quyền được bảo lưu.
          </p>
          <div className="flex items-center gap-8">
            <a href="#" className="text-slate-500 hover:text-white text-sm transition-colors">Chính sách bảo mật</a>
            <a href="#" className="text-slate-500 hover:text-white text-sm transition-colors">Điều khoản dịch vụ</a>
            <div className="flex items-center gap-2 px-4 py-2 bg-white/5 rounded-full border border-white/10">
              <div className="h-2 w-2 rounded-full bg-brand-secondary animate-pulse"></div>
              <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">System Status: Normal</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default LandingPage;
