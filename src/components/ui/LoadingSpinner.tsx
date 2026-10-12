'use client';

import { motion } from 'framer-motion';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export default function LoadingSpinner({ size = 'md', className = '' }: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
  };

  return (
    <motion.div
      className={`${sizeClasses[size]} ${className}`}
      animate={{ rotate: 360 }}
      transition={{
        duration: 1,
        repeat: Infinity,
        ease: 'linear',
      }}
    >
      <svg
        className="w-full h-full text-primary"
        fill="none"
        viewBox="0 0 24 24"
        xmlns="http://www.w3.org/2000/svg"
      >
        <circle
          className="opacity-25"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="4"
        />
        <path
          className="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
        />
      </svg>
    </motion.div>
  );
}

// Page-level loading component
export function PageLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center">
        <LoadingSpinner size="lg" className="mx-auto mb-4" />
        <p className="text-muted-foreground">Loading...</p>
      </div>
    </div>
  );
}

// Skeleton components
export function ProfileSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="glass-card p-8">
        <div className="flex items-center gap-6">
          <div className="w-32 h-32 bg-primary/20 rounded-2xl" />
          <div className="flex-1 space-y-3">
            <div className="h-8 bg-primary/20 rounded w-48" />
            <div className="h-4 bg-secondary/50 rounded w-64" />
            <div className="flex gap-2">
              <div className="h-6 bg-green-500/20 rounded-full w-24" />
              <div className="h-6 bg-primary/20 rounded-full w-20" />
            </div>
          </div>
        </div>
      </div>
      
      <div className="grid gap-4 md:grid-cols-2">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="h-32 bg-secondary/20 rounded-xl" />
        ))}
      </div>
    </div>
  );
}