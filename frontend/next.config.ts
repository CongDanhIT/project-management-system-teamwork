import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  experimental: {
    optimizePackageImports: [
      'lucide-react', 
      'framer-motion', 
      '@base-ui/react', 
      '@tanstack/react-query', 
      'date-fns',
      'zod'
    ],
  },
};

export default nextConfig;
